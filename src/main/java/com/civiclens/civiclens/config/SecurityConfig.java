package com.civiclens.civiclens.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${civiclens.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:3000}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Preflight OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public Auth APIs
                        .requestMatchers("/auth/login", "/auth/register").permitAll()

                        // Public static media uploads
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // File upload requires authentication
                        .requestMatchers(HttpMethod.POST, "/files/upload").authenticated()

                        // Public/Read-only Department list
                        .requestMatchers(HttpMethod.GET, "/departments", "/departments/*").permitAll()

                        // Admin APIs
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/auth/create-staff").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/departments/**", "/departments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/departments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/departments/**").hasRole("ADMIN")

                        // Citizen and Admin report submission
                        .requestMatchers(HttpMethod.POST, "/reports").hasAnyRole("CITIZEN", "ADMIN")

                        // Citizen/Staff/Admin view own reports
                        .requestMatchers(HttpMethod.GET, "/reports/my").hasAnyRole("CITIZEN", "ADMIN", "MUNICIPAL_STAFF")

                        // Staff-specific queues and actions
                        .requestMatchers(HttpMethod.GET, "/reports/staff", "/reports/staff/**").hasAnyRole("MUNICIPAL_STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/reports/*/staff-update").hasAnyRole("MUNICIPAL_STAFF", "ADMIN")

                        // Status update allowed for Admin and Staff
                        .requestMatchers(HttpMethod.PUT, "/reports/*/status").hasAnyRole("ADMIN", "MUNICIPAL_STAFF")

                        // Department assignment and priority management allowed for Admin
                        .requestMatchers(HttpMethod.PUT, "/reports/*/assign").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/reports/*/priority").hasRole("ADMIN")

                        // History view: authenticated (ownership checked in service)
                        .requestMatchers(HttpMethod.GET, "/reports/*/history").authenticated()

                        // Single report view & delete: authenticated (ownership & PENDING status rules checked in service)
                        .requestMatchers(HttpMethod.GET, "/reports/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/reports/*").authenticated()

                        // Notifications & Analytics require authentication
                        .requestMatchers("/notifications/**").authenticated()
                        .requestMatchers("/analytics/**").authenticated()

                        // Admin view all reports
                        .requestMatchers(HttpMethod.GET, "/reports").hasRole("ADMIN")

                        // All other report routes require authentication
                        .requestMatchers("/reports/**").authenticated()

                        // Any other request
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // Support exact origins as well as wildcards (e.g. https://*.vercel.app, https://*.onrender.com)
        configuration.setAllowedOriginPatterns(origins);

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
                "PATCH"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
