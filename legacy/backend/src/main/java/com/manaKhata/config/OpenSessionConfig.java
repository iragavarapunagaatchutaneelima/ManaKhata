package com.manaKhata.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;

/**
 * Opens the JPA EntityManager before the Spring Security filter chain runs.
 *
 * JwtAuthFilter loads the current User, and controllers attach its lazy
 * {@code household} proxy to new entities (expenses, trips, chores...). With the
 * default MVC interceptor the EntityManager only opens after security, so that
 * proxy is detached and Jackson fails with "could not initialize proxy - no Session".
 */
@Configuration
public class OpenSessionConfig {

    @Bean
    public FilterRegistrationBean<OpenEntityManagerInViewFilter> openEntityManagerInViewFilter() {
        FilterRegistrationBean<OpenEntityManagerInViewFilter> registration =
                new FilterRegistrationBean<>(new OpenEntityManagerInViewFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/api/*");
        return registration;
    }
}
