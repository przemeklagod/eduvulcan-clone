export interface JwtRegisterRequest {
  OS: 'iOS' | 'Android';
  Certificate: string;
  CertificateType: 'RSA_PEM';
  DeviceModel: string;
  SelfIdentifier: string;
  CertificateThumbprint: string;
  Tokens: string[];
}
