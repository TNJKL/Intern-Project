package com.beverage.product.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Server url "/" để Swagger UI (Try it out) gọi API cùng origin với trang đang mở
 * (nginx/ngrok), thay vì http://localhost:8082 → tránh mixed content / CORS.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI productOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Product Service API")
                        .description("Catalog: categories, products, toppings")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server()
                                .url("/")
                                .description("Cùng host hiện tại (vd. https://xxx.ngrok-free.dev qua nginx)")
                ));
    }
}
