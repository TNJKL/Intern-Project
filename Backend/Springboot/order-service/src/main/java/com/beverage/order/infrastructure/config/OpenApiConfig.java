package com.beverage.order.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI orderOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Order Service API")
                        .description("Đơn hàng: tạo, xem, hủy, quản trị trạng thái")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("/").description("Cùng host hiện tại (gateway/nginx)")
                ));
    }
}
