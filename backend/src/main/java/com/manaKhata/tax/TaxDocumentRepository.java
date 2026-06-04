package com.manaKhata.tax;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxDocumentRepository extends JpaRepository<TaxDocument, Long> {
    List<TaxDocument> findByOwnerIdOrderByDateUploadedDesc(Long ownerId);
}
