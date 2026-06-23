FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /workspace
COPY . .
RUN mvn -pl shared-jwt install -DskipTests && cd dashboard-service && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /workspace/dashboard-service/target/*.jar app.jar
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]
