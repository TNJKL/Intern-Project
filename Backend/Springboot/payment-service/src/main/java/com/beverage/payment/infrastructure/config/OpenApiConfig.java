package com.beverage.payment.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI paymentOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Payment Service API")
                        .description("API Quản lý thanh toán và hoàn tiền qua cổng VNPay")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("/").description("Cùng host hiện tại (gateway/nginx)")
                ));
    }
}
