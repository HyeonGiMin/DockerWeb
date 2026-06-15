# DockerWeb

Docker Desktop과 유사한 **웹 기반 Docker 관리 서비스**.
백엔드(.NET 10 / ASP.NET Core + Docker.DotNet)가 Docker Engine API와 통신하고,
프론트엔드(React + TypeScript / Vite)가 이를 SPA로 제공한다.

## 기능 (MVP)

- **이미지**: 목록 / Pull / Tag / 삭제(force) / dangling prune
- **컨테이너**: 목록 / 생성(포트·환경변수·볼륨·재시작정책) / 시작·정지·재시작·일시정지·삭제 / 실시간 로그 / 실시간 통계(CPU·메모리) / Inspect
- **볼륨**: 목록 / 생성 / 삭제 / prune
- **네트워크**: 목록 / 생성 / 삭제
- **실시간 모니터링**: SignalR로 컨테이너 stats·logs 스트리밍, 대시보드 5초 폴링
- **연결 전환**: 로컬(Docker Desktop named pipe) ↔ 원격(TCP + 선택적 TLS)을 설정 화면에서 전환

## 구조

```
DockerWeb/
├── DockerWeb.slnx
└── src/
    ├── DockerWeb.Api/      # ASP.NET Core (.NET 10) Web API + SignalR
    │   ├── Configuration/  # DockerOptions (연결 설정)
    │   ├── Docker/         # DockerConnectionManager (런타임 전환 클라이언트)
    │   ├── Models/         # 요청/응답 DTO (record)
    │   ├── Services/       # Image/Container/Volume/Network/System/Stats 서비스
    │   ├── Controllers/    # REST API
    │   ├── Hubs/           # MonitorHub (/hubs/monitor)
    │   └── Infrastructure/ # DockerApiException -> ProblemDetails 미들웨어
    └── client/             # React + TS (Vite) SPA
        └── src/{lib,types,hooks,components,pages,styles}
```

## 사전 요구사항

- .NET SDK 10
- Node.js 20+ (개발 환경 검증: v22)
- 실행 중인 Docker Engine (로컬은 Docker Desktop을 켜둘 것)

## 실행

### 1) 백엔드 (http://localhost:5080)

```bash
cd src/DockerWeb.Api
dotnet run
```

Swagger UI: http://localhost:5080/swagger (Development)

### 2) 프론트엔드 (http://localhost:5173)

```bash
cd src/client
npm install      # 최초 1회
npm run dev      # /api, /hubs(ws) -> :5080 프록시
```

브라우저에서 http://localhost:5173 접속.

## 연결 설정

기본값은 로컬 Docker Desktop:

```jsonc
// src/DockerWeb.Api/appsettings.json
"Docker": {
  "Mode": "Local",
  "LocalEndpoint": "npipe://./pipe/docker_engine",
  "RemoteEndpoint": null,
  "Tls": { "Enabled": false, "ClientCertPath": null, "ClientCertPassword": null }
}
```

원격 호스트는 Settings 화면에서 Mode를 `Remote`로 바꾸고
`tcp://<host>:2376` 엔드포인트와 (필요 시) 클라이언트 인증서(.pfx)를 지정한다.

> ⚠️ MVP에는 인증이 없다. Docker 제어는 호스트에 대한 강력한 권한이므로,
> 신뢰된 네트워크 외부에 노출하기 전 인증/권한 계층을 반드시 추가할 것.

## REST API 요약

| 영역 | 엔드포인트 |
|------|-----------|
| System | `GET /api/system/info`, `/ping`, `/df` |
| Settings | `GET·PUT /api/settings/connection` |
| Images | `GET /api/images`, `GET /{id}`, `POST /pull`, `POST /{id}/tag`, `DELETE /{id}`, `POST /prune` |
| Containers | `GET /api/containers`, `GET /{id}`, `POST /`, `POST /{id}/{start\|stop\|restart\|kill\|pause\|unpause}`, `DELETE /{id}`, `GET /{id}/logs`, `POST /prune` |
| Volumes | `GET /api/volumes`, `POST /`, `DELETE /{name}`, `POST /prune` |
| Networks | `GET /api/networks`, `GET /{id}`, `POST /`, `DELETE /{id}` |
| SignalR | `/hubs/monitor` → `StreamStats(containerId)`, `StreamLogs(containerId, tail)` |

## 서버에 배포 (자기 호스트 관리)

이 컨테이너는 **자기가 올라간 Docker 호스트만** 관리한다. 호스트의 로컬 Docker 소켓
(`/var/run/docker.sock`)을 마운트해서 그 호스트의 Docker만 제어하며, 원격 노출
(2375/2376, TLS, 외부 TCP)은 일절 하지 않는다. ("자기 서버만 보도록 해줘")

단일 컨테이너가 API와 React SPA를 **같은 포트(8080)에서 same-origin**으로 제공한다.
클라이언트는 상대경로(`/api`, `/hubs/monitor`)를 쓰므로 프로덕션에서 별도 설정이 필요 없다.

### 배포 (호스트에서 실행)

```bash
docker compose up -d --build
```

빌드가 끝나면 브라우저에서 `http://<host>:8080` 접속.
(예: 이 서버에서는 `http://10.10.140.28:8080`)

- 호스트의 로컬 Docker 소켓에 바인딩한다 — **2375/2376 없음, TLS 없음, 원격 노출 없음**.
  오직 **자기 호스트의 Docker만** 관리한다.
- 8080 포트가 사용 중이면 `docker-compose.yml`의 포트 매핑을 `8088:8080` 등으로 바꾸고
  `http://<host>:8088`로 접속한다.

### 보안 주의

- `docker.sock`을 마운트하면 컨테이너가 **호스트에 대한 root 동등 제어권**을 갖는다.
  외부에 노출하기 전에 **신뢰된 네트워크 / 리버스 프록시 + 인증** 뒤에 둘 것.
- **이 MVP에는 인증이 포함되어 있지 않다.**
- 런타임 이미지(`mcr.microsoft.com/dotnet/aspnet:10.0`)는 기본적으로 **root**로 실행되므로
  소켓 접근에 문제가 없다. 따라서 의도적으로 non-root `USER`를 추가하지 않았다.
- Linux에서 소켓이 `docker` 그룹 소유라면 기본 root 컨테이너 사용자는 여전히 접근 가능하다.
  이후 non-root로 실행한다면 `docker-compose.yml`에 `group_add: [<docker-gid>]`를 추가한다.
