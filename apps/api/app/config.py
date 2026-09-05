from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    environment: str = "development"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    # Was 15 — confirmed real-world friction: the onboarding form (niche,
    # business name, country, slug) is genuinely easy to spend close to that
    # long on, and a token expiring right as Leads loads next produced a
    # visible 401 before the refresh-retry in api.ts's request() kicked in.
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    cookie_secure: bool = False
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    google_calendar_redirect_uri: str = "http://localhost:8000/integrations/google/callback"
    zoom_client_id: str = ""
    zoom_client_secret: str = ""
    zoom_redirect_uri: str = "http://localhost:8000/integrations/zoom/callback"
    calendly_client_id: str = ""
    calendly_client_secret: str = ""
    calendly_redirect_uri: str = "http://localhost:8000/integrations/calendly/callback"
    calcom_client_id: str = ""
    calcom_client_secret: str = ""
    calcom_redirect_uri: str = "http://localhost:8000/integrations/calcom/callback"
    frontend_url: str = "http://localhost:3000"
    # This backend's own publicly reachable base URL — used to construct
    # outbound webhook subscription URLs (Calendly/Cal.com need a real
    # internet-reachable callback, not localhost) when registering a webhook
    # at OAuth-connect time. Set to the real deployed API domain in
    # production (e.g. https://api.coachevaos.com).
    api_base_url: str = "http://localhost:8000"
    # Always-allowed production origins, regardless of FRONTEND_URL. Extra
    # origins (a staging preview URL, a second custom domain) can be added
    # here without touching FRONTEND_URL, which stays the "primary app" value
    # used to build redirect/callback URLs elsewhere in this file's callers.
    cors_extra_origins: list[str] = ["https://coachevaos.com", "https://www.coachevaos.com"]
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    s3_bucket: str = ""
    s3_prefix: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # Payments — foundation settings usable before either provider is wired up.
    paddle_environment: str = "sandbox"
    payment_grace_period_days: int = 4
    geo_lookup_enabled: bool = True

    # Paddle (global/USD) — all default to "", inert until configured, matching
    # the truthiness-gate convention already used for google_client_id etc.
    paddle_api_key: str = ""
    paddle_client_side_token: str = ""
    paddle_webhook_secret: str = ""
    paddle_price_starter_monthly: str = ""
    paddle_price_starter_annual: str = ""
    paddle_price_growth_monthly: str = ""
    paddle_price_growth_annual: str = ""
    paddle_price_scale_monthly: str = ""
    paddle_price_scale_annual: str = ""
    paddle_price_pro_monthly: str = ""
    paddle_price_pro_annual: str = ""
    sales_contact_email: str = "sales@coachevaos.com"
    # Extra defense-in-depth on top of HMAC signature verification (the real
    # security boundary — this never replaces it). Off by default: turning it
    # on blindly in a deployment sitting behind an untrusted-header proxy
    # would either false-reject real Paddle deliveries or, if
    # paddle_webhook_trust_proxy_header is also mis-set, be spoofable. Confirm
    # your actual network path before enabling in production.
    paddle_webhook_ip_allowlist_enabled: bool = False
    # Only flip this on if the app sits behind a reverse proxy/load balancer
    # YOU control that itself overwrites X-Forwarded-For with the real client
    # IP (Cloudflare, most managed load balancers). If the proxy merely
    # appends to a client-supplied header, or there is no proxy at all,
    # leave this False — otherwise a request can spoof its way past the
    # allowlist by sending its own X-Forwarded-For.
    paddle_webhook_trust_proxy_header: bool = False

    @property
    def cors_origins(self) -> list[str]:
        # FRONTEND_URL is included so a staging/preview deploy that sets only
        # that one env var (not CORS_EXTRA_ORIGINS) still works without a
        # second env var to remember. localhost:3000 stays allowed even in
        # production settings so `next dev` can hit a deployed API during
        # testing — it's a fixed, well-known origin, not a real CORS risk.
        origins = [*self.cors_extra_origins, self.frontend_url, "http://localhost:3000"]
        return list(dict.fromkeys(origins))


settings = Settings()
