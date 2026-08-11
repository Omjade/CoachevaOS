from pydantic import BaseModel


class MfaSetupOut(BaseModel):
    secret: str
    otpauth_uri: str
    qr_data_uri: str


class MfaEnableRequest(BaseModel):
    code: str


class MfaEnableOut(BaseModel):
    backup_codes: list[str]


class MfaDisableRequest(BaseModel):
    password: str
    code: str


class MfaVerifyRequest(BaseModel):
    challenge_token: str
    code: str


class MfaRequiredOut(BaseModel):
    mfa_required: bool = True
    challenge_token: str
