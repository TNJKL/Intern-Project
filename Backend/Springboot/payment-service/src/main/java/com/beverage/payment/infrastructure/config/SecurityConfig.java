package com.beverage.payment.infrastructure.config;

import com.beverage.payment.infrastructure.security.InternalRequestFilter;
import com.beverage.payment.infrastructure.security.JwtAuthenticationFilter;
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
                .addFilterBefore(internalRequestFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtAuthenticationFilter, InternalRequestFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/payment/swagger-ui/**",
                                "/payment/swagger-ui.html",
                                "/payment/v3/api-docs",
                                "/payment/v3/api-docs/**",
                                "/actuator/**",
                                // Public VNPay IPN and Callback
                                "/api/v1/payments/vnpay/callback",
                                "/api/v1/payments/vnpay/ipn",
                                // Internal APIs (protected by InternalRequestFilter)
                                "/api/v1/internal/payments/**"
                        ).permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                );
        return http.build();
    }
}
