package com.manaKhata.backup;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReplicationMessage {
    private String entityType;
    private String action;
    private String jsonPayload;
}
