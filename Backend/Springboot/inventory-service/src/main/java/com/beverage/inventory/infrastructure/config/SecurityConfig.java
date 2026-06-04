package com.beverage.inventory.infrastructure.config;

import com.beverage.inventory.infrastructure.security.InternalRequestFilter;
import com.beverage.inventory.infrastructure.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final InternalRequestFilter internalRequestFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // SEC-01: InternalRequestFilter chạy trước cùng — chặn /check-availability không có header
                .addFilterBefore(internalRequestFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtAuthenticationFilter, InternalRequestFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/inventory/swagger-ui/**",
                                "/inventory/swagger-ui.html",
                                "/inventory/v3/api-docs",
                                "/inventory/v3/api-docs/**",
                                "/actuator/**",
                                "/api/v1/inventory/test/public",
                                // check-availability vẫn permitAll ở Spring Security layer
                                // nhưng InternalRequestFilter đã kiểm tra X-Internal-Secret trước
                                "/api/v1/inventory/check-availability"
                        ).permitAll()
                        .requestMatchers("/api/v1/inventory/test/private").authenticated()
                        .requestMatchers("/api/v1/inventory/test/admin").hasRole("ADMIN")
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                );
        return http.build();
    }
}

