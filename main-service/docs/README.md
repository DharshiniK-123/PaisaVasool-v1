# Paisa Vasool API Gateway

## 📌 Overview

This service acts as an **API Gateway** for the Paisa Vasool system.
It routes incoming client requests to appropriate backend microservices.

### Responsibilities:

* Request routing (Auth Service, Matching Service)
* Header forwarding (Authorization)
* Request/Response transformation
* Error handling and fallback responses
* Structured logging

---

## 🏗️ Architecture

```
Client → API Gateway → Microservices
                      ├── Auth Service
                      └── Payment Matching Service
```

---

## ⚙️ Tech Stack

* FastAPI (async framework)
* HTTPX (async HTTP client)
* Pydantic Settings (config management)
* Python JSON Logger (structured logging)
* Uvicorn (ASGI server)

---

## 📂 Project Structure

```
src/
 ├── api/
 │   ├── middleware/
 │   ├── rest/
 │   │   ├── routes/
 │   │   └── app.py
 ├── config/
 │   └── settings.py
```

---

## 🔧 Environment Variables

Create a `.env` file:

```
AUTH_SERVICE_URL=http://localhost:8001
MATCHING_SERVICE_URL=http://localhost:8002
HTTP_TIMEOUT=10
LOG_LEVEL=INFO
```

---

## 🚀 Running the Service

### Local

```
uvicorn src.api.rest.app:app --reload
```

### Docker

```
docker build -t api-gateway .
docker run -p 8000:8000 api-gateway
```

---

## 🔀 API Routing

### Auth Service

```
/api/v1/users/* → AUTH_SERVICE
```

### Matching Service

```
/api/v1/payment_intake_matching/* → MATCHING_SERVICE
```

---

## ⚠️ Error Handling

The gateway returns:

| Scenario            | Status Code |
| ------------------- | ----------- |
| Service unavailable | 503         |
| Upstream error      | 502         |
| Internal error      | 500         |

---

## 📊 Logging

* JSON structured logs
* Includes:

  * request path
  * method
  * status code
  * upstream URL

---

## 🧪 Testing

Basic tests ensure:

* Routing works
* Error handling works
* Gateway is reachable

Run:

```
pytest
```

---

## 🔐 Security Notes

* `Authorization` header is forwarded
* CORS is configured
* `.env` is ignored in git

---

## 📌 Notes

* This service does NOT contain business logic
* No database is used
* Designed to be lightweight and scalable
