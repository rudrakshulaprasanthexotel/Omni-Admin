export interface LoginResponse {
    requestId: string
    contactCenterId: number
    userSessionInfo: UserSessionInfo
    authenticationState: AuthenticationState
    configurations: Configurations
}
  
interface UserSessionInfo {
    userId: string
    terminalInfo: string
    sessionId: string
    loginTime: number
    userType: UserType
    lastLoginInfo: LastLoginInfo
    publicIp: any
    clientType: any
    clientVersion: any
    browserInfo: any
    authenticationPolicy: any
    userName: string
    rootUser: boolean
}
  
interface LastLoginInfo {
    userId: string
    userName: string
    lastLoginTime: number
    lastLogoutTime: number
    sessionId: string
    localIp: string
    publicIp: any
    clientType: string
    clientVersion: string
    browserInfo: any
}
  
interface AuthenticationState {
    userId: string
    authPolicyVsUserAuthState: AuthPolicyVsUserAuthState
    authPolicyVsUserInfo: AuthPolicyVsUserInfo
}
  
interface AuthPolicyVsUserAuthState {}
  
interface AuthPolicyVsUserInfo {
    "auth.type.passwd": AuthTypePasswd
}
  
interface AuthTypePasswd {
    userId: string
    sessionId: string
    properties: Properties
    loginProperties: LoginProperties
}
  
interface Properties {
    passwordStateDetail: PasswordStateDetail
}
  
interface PasswordStateDetail {
    reason: any
    passwordValid: boolean
    warnUser: boolean
    shouldChangePassword: boolean
}
  
interface LoginProperties {
    appType: any
    appVersion: any
    mobile_device_source: string
    "cms.server.domain": string
    "cms.server.port": string
    "data.engine.server.domain": string
    "data.engine.server.port": string
    "cfs.server.domain": string
    "cfs.server.port": string
    "customer.manager.server.domain": string
    "customer.manager.server.port": string
    "callback.server.domain": string
    "callback.server.port": string
    "interaction.server.domain": string
    "interaction.server.port": string
    "crm.connector.server.domain": string
    "crm.connector.server.port": string
    "chat.service.server.domain": string
    "chat.service.server.port": string
    "bosh.service.server.domain": string
    "bosh.service.server.port": string
    "ccdp.server.domain": string
    "ccdp.server.port": string
    "cqa.server.domain": string
    "cqa.server.port": string
    "omni.new.app.ui.redirection.domain": any
    "nodered.server.domain": string
    "nodered.server.port": string
    isSingleDomain: string
    accountId: string
    setupId: string
    jwt: string
    jwtTokenExpiryMs: string
    contact_center_id: string
    stamp_version: string
}
  
interface Configurations {}

interface ICaptcha {
    captchaId: string;
    enteredCaptchaText: string;
}

export interface ILoginRequestInputBean {
    userId: string | null;
    token: string | null;
    domain: string;
    forceLogin?: boolean;
    properties?: { [key: string]: string | null };
    captchaAuthenticationInputBean?: ICaptcha;
    locale?: string;
    requestId?: string | null;
    clientType?: string;
    clientVersion?: string;
}

export const UserType = {
    ADMIN: 'Administrator',
    SUPERVISOR: 'Supervisor',
    EXECUTIVE: 'Executive'
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];

export interface ILogoutRequestInputBean {
    sessionId: string;
    reason: string;
}

export interface IKeepAliveWithPingPushRequestInputBean {
    sessionId: string;
    lastProcessedPushId?: number;
    listenerName?: string;
    pushesFollowPing?: boolean;
}

export interface IRefreshTokenRequestInputBean {
    userId: string;
}

export interface IRefreshTokenResponse {
    jwtToken: string;
}

export interface ILoginErrorResponse {
    timestamp: string
    path: string
    status: number
    error: string
    requestId: string
}

/** Shape of the error payload returned by the login API. */
export interface ILoginApiErrorData {
    message: string | null
    info: string | null
    status: number
    errorCode: number
}

/** Value passed to `rejectWithValue` when the login thunk fails. */
export interface ILoginRejectValue {
    message: string
    errorCode: number | null
}
