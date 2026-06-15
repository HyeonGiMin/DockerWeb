# syntax=docker/dockerfile:1

# ---- Stage 1: build the SPA ----
FROM node:22-alpine AS client
WORKDIR /client
COPY src/client/package.json src/client/package-lock.json ./
RUN npm ci
COPY src/client/ ./
RUN npm run build

# ---- Stage 2: build backend + bundle SPA into wwwroot ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/DockerWeb.Api/DockerWeb.Api.csproj ./DockerWeb.Api/
RUN dotnet restore ./DockerWeb.Api/DockerWeb.Api.csproj
COPY src/DockerWeb.Api/ ./DockerWeb.Api/
RUN dotnet publish ./DockerWeb.Api/DockerWeb.Api.csproj -c Release -o /app/publish /p:UseAppHost=false
COPY --from=client /client/dist /app/publish/wwwroot

# ---- Stage 3: runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    Docker__Mode=Local \
    Docker__LocalEndpoint=unix:///var/run/docker.sock
EXPOSE 8080
ENTRYPOINT ["dotnet", "DockerWeb.Api.dll"]
