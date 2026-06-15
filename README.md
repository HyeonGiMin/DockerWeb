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
