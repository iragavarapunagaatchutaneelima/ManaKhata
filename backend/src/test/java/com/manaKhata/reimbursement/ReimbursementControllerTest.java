package com.manaKhata.reimbursement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.household.Household;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.manaKhata.config.DataInitializer;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SuppressWarnings("null")
class ReimbursementControllerTest {

    @MockBean
    private DataInitializer dataInitializer;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ReimbursementRepository reimbursementRepository;

    private User mockUser;

    @BeforeEach
    void setUp() {
        Household household = new Household();
        household.setId(1L);

        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("test@gmail.com");
        mockUser.setHousehold(household);
        
        Mockito.when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(mockUser));
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        // Mock save to return exactly what was passed in
        Mockito.when(reimbursementRepository.save(Mockito.any(Reimbursement.class)))
               .thenAnswer(invocation -> {
                   Reimbursement r = invocation.getArgument(0);
                   r.setId(100L); // simulate db save
                   return r;
               });
    }

    @Test
    void testCreateReimbursement() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(mockUser, null, mockUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ReimbursementRequest request = new ReimbursementRequest();
        request.setAmount(500.0);
        request.setDescription("Dinner payment");
        request.setCategory("FOOD");

        mockMvc.perform(post("/api/reimbursements")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100L))
                .andExpect(jsonPath("$.data.amount").value(500.0))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }
}
