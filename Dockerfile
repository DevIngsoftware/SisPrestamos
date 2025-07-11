FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM base AS final
WORKDIR /app
COPY . .
ENTRYPOINT ["dotnet", "Prestamo.Web.dll"]
