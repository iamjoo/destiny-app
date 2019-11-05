import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {from, fromEvent, interval as intervalOf, Observable, of as observableOf, race, Subject, timer as timerOf} from 'rxjs';

import {uuid} from '../util/util';

const API_KEY = 'af40b0c22c6545d59895a4afc986eafd';
// REPLACE WITH CHARACTER ID FROM TOKEN
const CHARACTER_ID = '2305843009299377989';
const CLIENT_ID = '30689';
const DESTINY_API_URL = 'https://www.bungie.net/Platform';
const STATE = uuid();
const TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/';
const AUTHZ_URL = `https://www.bungie.net/en/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&state=${STATE}`;

// https://bungie-net.github.io/multi/schema_Destiny-DestinyComponentType.html#schema_Destiny-DestinyComponentType
enum ComponentType {
  NONE = 0,
  PROFILES = 100,
  VENDOR_RECEIPTS = 101,
  PROFILE_INVENTORIES = 102,
  VENDORS = 400,
  VENDOR_CATEGORIES = 401,
  VENDOR_SALES = 402,
}

enum EntityType {
  ITEM = 'DestinyInventoryItemDefinition',
  VENDOR = 'DestinyVendorDefinition',
}

// https://bungie-net.github.io/multi/schema_BungieMembershipType.html#schema_BungieMembershipType
enum MembershipType {
  NONE = 0,
  XBOX = 1,
  PSN = 2,
  STEAM = 3,
  BLIZZARD = 4,
  STADIA = 5,
  DEMON = 10,
  BUNGIE_NEXT = 254,
  ALL = -1,
}

enum StorageKey {
  ACCESS_TOKEN = 'access_token',
  DESTINY_ID = 'destiny_id',
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  membership_id: number;
  token_type: string;
}

interface StoredAccessToken {
  access_token: string;
  expiration_ms: number;
}

// https://bungie-net.github.io/multi/schema_GroupsV2-GroupUserInfoCard.html#schema_GroupsV2-GroupUserInfoCard
interface GroupUserInfoCard {
  membershipType: MembershipType;
  membershipId: number;
  displayName: string;
}

// https://bungie-net.github.io/multi/schema_User-UserMembershipData.html#schema_User-UserMembershipData
interface UserMembershipData {
  destinyMemberships: GroupUserInfoCard[];
  bungieNetUser: any;
}

// https://bungie-net.github.io/multi/schema_Destiny-Responses-DestinyVendorsResponse.html#schema_Destiny-Responses-DestinyVendorsResponse
interface VendorsResponse {
  vendorGroups: NestedApiResponse<VendorGroupComponent>;
  vendors: NestedApiResponse<MappedVendorComponent>;
  categories: string;
  // more
}

interface MappedVendorComponent {
  [vendorHash: number]: VendorComponent;
}

interface VendorComponent {
  vendorHash: number;
  enabled: boolean;
}

interface VendorGroupComponent {
  groups: Array<VendorGroup>;
}

interface VendorGroup {
  vendorGroupHash: number; // see https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyVendorGroupDefinition.html#schema_Destiny-Definitions-DestinyVendorGroupDefinition
  vendorHashes: number[]; // see https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyVendorDefinition.html#schema_Destiny-Definitions-DestinyVendorDefinition
}

// https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyVendorDefinition.html#schema_Destiny-Definitions-DestinyVendorDefinition
interface Vendor {
  displayProperties: VendorDisplayProperties;
  vendorPortrait: string;
  enabled: boolean;
  visible: boolean;
  displayCategories: DisplayCategory[];
  itemList: VendorItem[];
  hash: number;
}

// https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyVendorItemDefinition.html#schema_Destiny-Definitions-DestinyVendorItemDefinition
interface VendorItem {
  itemHash: number; // https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyInventoryItemDefinition.html#schema_Destiny-Definitions-DestinyInventoryItemDefinition
}

// https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyInventoryItemDefinition.html#schema_Destiny-Definitions-DestinyInventoryItemDefinition
interface Item {
  hash: number;
  itemTypeDisplayName: string;
}

// https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyDisplayCategoryDefinition.html#schema_Destiny-Definitions-DestinyDisplayCategoryDefinition
interface DisplayCategory {
  index: number;
  identifier: string;
  displayCategoryHash: number;
}

// https://bungie-net.github.io/multi/schema_Destiny-Definitions-DestinyVendorDisplayPropertiesDefinition.html#schema_Destiny-Definitions-DestinyVendorDisplayPropertiesDefinition
interface VendorDisplayProperties {
  largeIcon: string;
  subtitle: string;
  description: string;
  name: string;
}

interface Manifest {
  version: string;
  mobileGearAssetDataBases: string;
  mobileWorldContentPaths: {};
}

interface ApiResponse<T> {
  Response: T;
  ErrorCode: number;
  ErrorStatus: string;
  Message: string;
  MessageData: {};
  ThrottleSeconds: number;
}

interface NestedApiResponse<T> {
  data: T;
}

function buildQueryString(components: ComponentType[]): string {
  return `?components=${components.join(',')}`;
}

function isStillValid(storedToken: string) {
  const token: StoredAccessToken = JSON.parse(storedToken);
  return Date.now() < token.expiration_ms;
}

function storeToken(tokenReponse: AccessTokenResponse) {
  const newToken: StoredAccessToken = {
    access_token: tokenReponse.access_token,
    expiration_ms: Date.now() + tokenReponse.expires_in * 1000,
  }

  localStorage.setItem(StorageKey.ACCESS_TOKEN, JSON.stringify(newToken));
}

@Injectable({providedIn: 'root'})
export class ApiService {
  private authzCode = '';
  private token = '';
  private destinyId = '';
  private readonly authzReady$ = new Subject<{}>();

  constructor(private readonly httpClient: HttpClient) {
    // check token
    const storedToken = localStorage.getItem(StorageKey.ACCESS_TOKEN);
    if (storedToken && isStillValid(storedToken)) {
      console.log('using stored token');
      const accessToken: StoredAccessToken = JSON.parse(storedToken);
      this.token = accessToken.access_token;
    } else {
      // get authzcode
      this.authzReady$.subscribe(() => this.getToken());
      this.getAuthzCode();
    }
  }

  getAuthzCode(): void {
    const newWindow =
        window.open(AUTHZ_URL, 'authz', 'resizable=yes, width=600, height=600');

    const eventListener$ = fromEvent(window, 'message').pipe(
        map((e: MessageEvent) => this.handleCode(e, newWindow)));
    const timer$ = timerOf(5 * 60 * 1000 /* 5 min */);

    // Ping the popup until it responds back or after 5 min
    intervalOf(1000).pipe(
        map(() => {
          console.log('pinging popup');
          newWindow.postMessage(
              'check', 'https://iamjoo.github.io/destiny-app/authz');
        }),
        takeUntil(race(eventListener$, timer$)),
        ).subscribe();
  }

  private handleCode(event: MessageEvent, newWindow: Window): void {
    newWindow.close();

    const {code, state} = event.data;
    if (state !== STATE) {
      console.warn(`state mismatch: [${state}]`);
      return;
    }

    this.authzCode = code;
    this.authzReady$.next();
  }

  private getDestinyId(): Observable<void> {
    const storedDestinyId = localStorage.getItem(StorageKey.DESTINY_ID);
    if (storedDestinyId) {
      this.destinyId = storedDestinyId;
      return observableOf();
    }

    const getMembershipsPath = `/User/GetMembershipsForCurrentUser/`;

    return this.httpClient.get(
        DESTINY_API_URL + getMembershipsPath, this.createAuthzHeaders())
        .pipe(
            map((response: ApiResponse<UserMembershipData>) => {
              console.log('retrieved memberships')
              console.log(response);
              return from(response.Response.destinyMemberships);
            }),
            switchMap((info) => info),
            filter((membership) => {
              return membership.membershipType === MembershipType.STEAM;
            }),
            map((userInfo) => {
              const destinyId = `${userInfo.membershipId}`;
              localStorage.setItem(StorageKey.DESTINY_ID, destinyId);
              this.destinyId = destinyId;
            }),
            );
  }

  private getEntity<T>(entityType: EntityType, hash: number): Observable<ApiResponse<T>> {
    const getEntityPath = `/Destiny2/Manifest/${entityType}/${hash}/`;

    return this.httpClient.get<ApiResponse<T>>(
        DESTINY_API_URL + getEntityPath, this.createAuthzHeaders());
  }

  getManifest() {
    const getManifestPath = `/Destiny2/Manifest/`;

    this.httpClient.get(
        DESTINY_API_URL + getManifestPath, this.createAuthzHeaders())
        .pipe(
            map((response: ApiResponse<Manifest>) => {
              console.log('retrieved manifest')
              console.log(response);
            }),
            )
        .subscribe();
  }

  getToken() {

    const httpTokenOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': API_KEY,
      }),
    };

    this.httpClient.post(
        TOKEN_URL,
        `grant_type=authorization_code&code=${this.authzCode}&client_id=${CLIENT_ID}`,
        httpTokenOptions).subscribe((response: AccessTokenResponse) => {
      console.log('retrieved new token');
      console.log(response);
      storeToken(response);

      this.token = response.access_token;
    });
  }

  getVendors() {
    // https://bungie-net.github.io/multi/operation_get_Destiny2-GetVendors.html#operation_get_Destiny2-GetVendors
    const getVendorsPath =
    `/Destiny2/${MembershipType.STEAM}/Profile/${this.destinyId}/Character/${CHARACTER_ID}/Vendors/${buildQueryString([ComponentType.VENDORS])}`;

    this.httpClient.get(
        DESTINY_API_URL + getVendorsPath, this.createAuthzHeaders())
        .pipe(
            map((response: ApiResponse<VendorsResponse>) => {
              console.log('retrieved vendors');
              console.log(response);

              const vendorsMap = response.Response.vendors.data;
              const firstVendorHash = Object.keys(vendorsMap)[0];
              console.log(`firstVendorHash: ${firstVendorHash}`);

              return this.getEntity<Vendor>(EntityType.VENDOR, Number(firstVendorHash));
            }),
            switchMap((response) => {
              console.log(response);
              return response;
            }),
            )
    .subscribe((a) => {
      console.log('retrieved single vendor');
      console.log(a);
      a.Response.displayCategories[0].displayCategoryHash
    });
  }

  private createAuthzHeaders() {
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.token}`,
        'X-API-Key': API_KEY,
      }),
    };
  }
}
