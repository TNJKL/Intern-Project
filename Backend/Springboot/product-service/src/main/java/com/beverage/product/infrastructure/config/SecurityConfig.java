package com.beverage.product.infrastructure.config;

import com.beverage.product.infrastructure.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        // Swagger/OpenAPI - public (prefix /product/ — trùng cấu hình springdoc)
                        .requestMatchers(
                                "/product/swagger-ui/**",
                                "/product/swagger-ui.html",
                                "/product/v3/api-docs",
                                "/product/v3/api-docs/**",
                                "/product/webjars/**",
                                "/actuator/**"
                        ).permitAll()

                        // Public catalog GET
                        .requestMatchers(HttpMethod.GET,                          
                                "/api/v1/categories/**",
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/api/v1/toppings",
                                "/api/v1/toppings/**"
                        ).permitAll()

                        // ADMIN writes
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/categories",
                                "/api/v1/categories/**",
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/api/v1/toppings",
                                "/api/v1/toppings/**",
                                "/api/v1/storage/images"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/storage/consistency/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/categories/**",
                                "/api/v1/products/**",
                                "/api/v1/toppings/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/v1/categories/**",
                                "/api/v1/products/**",
                                "/api/v1/toppings/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/categories/**",
                                "/api/v1/products/**",
                                "/api/v1/toppings/**"
                        ).hasRole("ADMIN")

                        .anyRequest().authenticated()
                );

        return http.build();
    }
}

