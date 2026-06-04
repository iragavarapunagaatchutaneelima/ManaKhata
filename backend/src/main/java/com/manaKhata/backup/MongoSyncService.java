package com.manaKhata.backup;

import com.manaKhata.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "manakhata.mongo.enabled", havingValue = "true", matchIfMissing = false)
public class MongoSyncService {

    private final MongoTemplate mongoTemplate;

    @RabbitListener(queues = RabbitMQConfig.SYNC_QUEUE)
    @SuppressWarnings("null")
    public void syncToMongo(ReplicationMessage message) {
        if (message == null || message.getJsonPayload() == null) {
            log.warn("Received empty ReplicationMessage. Cannot sync to MongoDB.");
            return;
        }

        String collectionName = message.getEntityType().toLowerCase() + "s";

        try {
            Document document = Document.parse(message.getJsonPayload());

            if ("DELETED".equals(message.getAction())) {
                mongoTemplate.remove(document, collectionName);
                log.debug("Deleted {} from MongoDB collection {}", message.getEntityType(), collectionName);
            } else {
                mongoTemplate.save(document, collectionName);
                log.debug("Saved/Updated {} to MongoDB collection {}", message.getEntityType(), collectionName);
            }
        } catch (Exception e) {
            log.error("Failed to sync entity to MongoDB from RabbitMQ: {}", e.getMessage(), e);
        }
    }
}
