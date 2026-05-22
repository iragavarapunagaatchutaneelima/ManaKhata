package com.manaKhata.backup;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class DataChangedEvent extends ApplicationEvent {
    
    private final String entityType;
    private final String action;

    public DataChangedEvent(Object source, String entityType, String action) {
        super(source);
        this.entityType = entityType;
        this.action = action;
    }
}
