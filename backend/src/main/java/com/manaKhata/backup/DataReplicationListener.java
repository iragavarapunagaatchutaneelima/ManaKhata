package com.manaKhata.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.manaKhata.config.RabbitMQConfig;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "manakhata.mongo.enabled", havingValue = "true", matchIfMissing = false)
public class DataReplicationListener {

    private static RabbitTemplate rabbitTemplate;
    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Autowired
    public void setRabbitTemplate(@Lazy RabbitTemplate template) {
        DataReplicationListener.rabbitTemplate = template;
    }

    @PostPersist
    public void onPostPersist(Object entity) {
        publishEvent(entity, "CREATED");
    }

    @PostUpdate
    public void onPostUpdate(Object entity) {
        publishEvent(entity, "UPDATED");
    }

    @PostRemove
    public void onPostRemove(Object entity) {
        publishEvent(entity, "DELETED");
    }

    private void publishEvent(Object entity, String action) {
        if (rabbitTemplate != null) {
            try {
                String jsonPayload = objectMapper.writeValueAsString(entity);
                ReplicationMessage message = new ReplicationMessage(entity.getClass().getSimpleName(), action, jsonPayload);
                rabbitTemplate.convertAndSend(RabbitMQConfig.SYNC_QUEUE, message);
                log.debug("Published RabbitMQ Event: {} on {}", action, entity.getClass().getSimpleName());
            } catch (Exception e) {
                log.error("Failed to publish RabbitMQ event for {}", entity.getClass().getSimpleName(), e);
            }
        }
    }
}
