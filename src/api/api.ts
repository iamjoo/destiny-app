import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {filter, map, switchMap, tap} from 'rxjs/operators';
import {from} from 'rxjs';

const API_KEY = 'af40b0c22c6545d59895a4afc986eafd';
// REPLACE WITH CHARACTER ID FROM TOKEN
const CHARACTER_ID = '2305843009299377989';
const CLIENT_ID = '30689';
const DESTINY_API_URL = 'https://www.bungie.net/Platform';
const TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/';
const AUTHZ_URL = `https://www.bungie.net/en/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&state=someState`;
const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

interface AccessToken {
  access_token: string;
  expires_in: number;
  membership_id: number;
  token_type: string;
}

interface StoredAccessToken {
  access_token: string;
  expiration_ms: number;
}

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

interface AccountResponse {
  Response: UserMembershipData;
}

function buildQueryString(components: ComponentType[]): string {
  return `?components=${components.join(',')}`;
}

function isExpired(storedToken: string) {
  const token: StoredAccessToken = JSON.parse(storedToken);
  return Date.now() >= token.expiration_ms;
}

@Injectable({providedIn: 'root'})
export class ApiService {
  private authzCode = '';
  private token = '';
  private destinyMembershipId = 0;

  constructor(private readonly httpClient: HttpClient, location: Location) {
    const path = location.path();
    const startIndex = path.indexOf('?');

    if (path && startIndex) {
      const code = new URLSearchParams(path.substring(startIndex)).get('code');
      console.log(`code: ${code}`);

      if (code) {
        this.authzCode = code;
      }
    }
  }

  getAuthzPath() {
    return AUTHZ_URL;
  }

  getAccount() {
    const getAccountPath = `/User/GetMembershipsForCurrentUser/`;

    this.httpClient.get(
        DESTINY_API_URL + getAccountPath, this.createAuthzHeaders())
        .pipe(
            map((response: AccountResponse) => {
              console.log('retrieved memberships')
              console.log(response);
              return from(response.Response.destinyMemberships);
            }),
            switchMap((info) => info),
            filter((membership) => {
              return membership.membershipType === MembershipType.STEAM;
            }),
            map((userInfo) => {
              this.destinyMembershipId = userInfo.membershipId;
            }),
            )
        .subscribe();
  }

  getVendors() {
    // https://bungie-net.github.io/multi/operation_get_Destiny2-GetVendors.html#operation_get_Destiny2-GetVendors
    const getVendorsPath =
    `/Destiny2/${MembershipType.STEAM}/Profile/${this.destinyMembershipId}/Character/${CHARACTER_ID}/Vendors/${buildQueryString([ComponentType.VENDORS])}`;

    this.httpClient.get(DESTINY_API_URL + getVendorsPath, this.createAuthzHeaders()).subscribe((a) => {
      console.log('retrieved vendors');
      console.log(a);
    });
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
        httpTokenOptions).subscribe((a: AccessToken) => {
      console.log('retrieved token');
      console.log(a);

      let accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      if (!accessToken || isExpired(accessToken)) {
        // store it
        console.log('storing new token');
        const newToken = {
          expiration_ms: Date.now() + a.expires_in * 1000,
          access_token: a.access_token,
        }
        accessToken = JSON.stringify(newToken);
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      } else {
        console.log('using stored token');
      }

      const parsedToken: StoredAccessToken = JSON.parse(accessToken);
      this.token = parsedToken.access_token;
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
