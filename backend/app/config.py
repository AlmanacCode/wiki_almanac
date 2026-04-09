from pydantic import BaseModel


class Settings(BaseModel):
    mediawiki_base_url: str = "http://127.0.0.1:8080"
    mediawiki_api_url: str = "http://127.0.0.1:8080/api.php"
    mediawiki_rest_url: str = "http://127.0.0.1:8080/rest.php/v1"


settings = Settings()
