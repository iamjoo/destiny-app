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
// REPLACE WITH MEMBERSHIP ID FROM TOKEN
const MEMBERSHIP_ID = '4611686018467185892';
const TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/';

const httpTokenOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-API-Key': API_KEY,
  }),
};

const httpOptions = {
  headers: new HttpHeaders({
    'X-API-Key': API_KEY,
  }),
};

const httpOptionsWithAuthz = {
  headers: new HttpHeaders({
    // REPLACE WITH ACTUAL TOKEN
    // 'Authorization': 'access token',
    'X-API-Key': API_KEY,
  }),
};

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

interface AccessToken {
  access_token: string;
  expires_in: number;
  membership_id: number;
  token_type: string;
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

function buildQueryString(components: ComponentType[]): string {
  return `?components=${components.join(',')}`;
}

const authzPath = `https://www.bungie.net/en/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&state=someState`;

// https://bungie-net.github.io/multi/operation_get_Destiny2-GetVendors.html#operation_get_Destiny2-GetVendors
// /Destiny2/{membershipType}/Profile/{destinyMembershipId}/Character/{characterId}/Vendors/
// const getVendorsPath =
//     `/Destiny2/${MembershipType.STEAM}/Profile/${MEMBERSHIP_ID}/Character/${CHARACTER_ID}/Vendors/${buildQueryString([ComponentType.VENDORS])}`;

@Injectable({providedIn: 'root'})
export class ApiService {
  private code = '';
  private token = '';
  private bungieMembershipId = 0;
  private destinyMembershipId = 0;

  constructor(private readonly httpClient: HttpClient, location: Location) {
    const path = location.path();
    const startIndex = path.indexOf('?');

    if (path && startIndex) {
      const code = new URLSearchParams(path.substring(startIndex)).get('code');
      console.log(`code: ${code}`);

      if (code) {
        this.code = code;
      }
    }
  }

  getAuthzPath() {
    return authzPath;
  }

  getAccount() {
    const getAccountPath = `/User/GetMembershipsForCurrentUser/`;
    const httpOptionsWithAuthz = {
      headers: new HttpHeaders({
        'Authorization':`Bearer ${this.token}`,
        'X-API-Key': API_KEY,
      }),
    };

    this.httpClient.get(DESTINY_API_URL + getAccountPath, httpOptionsWithAuthz)
        .pipe(
            tap(a => {
              console.log('retrieved memberships')
              console.log(a);
            }),
            map((membershipData: UserMembershipData) => {
              return from(membershipData.destinyMemberships);
            }),
            switchMap((info) => {
              return info;
            }),
            filter((membership) => {
              return membership.membershipType === MembershipType.STEAM;
            }),
            map((a) => {
              this.destinyMembershipId = a.membershipId;
            }),
            )
        .subscribe();
  }

  getData() {
    const httpOptionsWithAuthz = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.token}`,
        'X-API-Key': API_KEY,
      }),
    };

    const getVendorsPath =
    `/Destiny2/${MembershipType.STEAM}/Profile/${this.destinyMembershipId}/Character/${CHARACTER_ID}/Vendors/${buildQueryString([ComponentType.VENDORS])}`;

    this.httpClient.get(DESTINY_API_URL + getVendorsPath, httpOptionsWithAuthz).subscribe((a) => {
      console.log('with DIM member id')
      console.log(a);
    });
  }

  getToken() {
    this.httpClient.post(
        TOKEN_URL,
        `grant_type=authorization_code&code=${this.code}&client_id=${CLIENT_ID}`,
        httpTokenOptions).subscribe((a: AccessToken) => {
      console.log('retrieved token');
      console.log(a);
      this.token = a.access_token;
      this.bungieMembershipId = a.membership_id;
    });
  }
}
