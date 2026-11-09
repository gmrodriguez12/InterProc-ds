FROM mcr.microsoft.com/dotnet/sdk:10.0 AS development

WORKDIR /src

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/InterProc.Api/InterProc.Api.csproj InterProc.Api/
RUN dotnet restore InterProc.Api/InterProc.Api.csproj

EXPOSE 8080

CMD ["dotnet", "watch", "run", "--project", "InterProc.Api/InterProc.Api.csproj", "--urls", "http://0.0.0.0:8080"]

FROM development AS publish

COPY backend/InterProc.Api/ InterProc.Api/
RUN dotnet publish InterProc.Api/InterProc.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS production

WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/lib/interproc/keys \
    && chown -R $APP_UID:$APP_UID /var/lib/interproc

COPY --from=publish /app/publish .
USER $APP_UID

ENTRYPOINT ["dotnet", "InterProc.Api.dll"]
