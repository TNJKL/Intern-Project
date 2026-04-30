FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy pom.xml and src to build the project
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create a lightweight image to run the app
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
