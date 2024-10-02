# This file is not currently (to avoid adding Terraform for now) in use but is kept for future reference.

terraform {
  required_providers {
    postgresql = {
      source = "cyrilgdn/postgresql"
      version = "1.23.0"
    }
  }
}

provider "postgresql" {
  host            = "localhost"
  port            = 5432
  database        = "postgres"
  username        = "postgres"
  password        = ""
  sslmode         = "disable"
  connect_timeout = 15
}

resource "postgresql_database" "webui" {
  name = "webui"
}
# equal to
# CREATE DATABASE webui;
