package com.beverage.inventory.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI inventoryOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Inventory Service API")
                        .description("Kho hàng và công thức: xem, cập nhật nguyên liệu")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("/").description("Cùng host hiện tại (gateway/nginx)")
                ));
    }
}
