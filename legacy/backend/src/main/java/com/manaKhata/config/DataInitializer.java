package com.manaKhata.config;

import com.manaKhata.asset.Vehicle;
import com.manaKhata.asset.VehicleExpense;
import com.manaKhata.asset.VehicleExpenseRepository;
import com.manaKhata.asset.VehicleExpenseType;
import com.manaKhata.asset.VehicleRepository;
import com.manaKhata.asset.VehicleType;
import com.manaKhata.auth.Gender;
import com.manaKhata.auth.User;
import com.manaKhata.auth.UserRepository;
import com.manaKhata.auth.UserRole;
import com.manaKhata.budget.Budget;
import com.manaKhata.budget.BudgetRepository;
import com.manaKhata.budget.BudgetType;
import com.manaKhata.expense.Expense;
import com.manaKhata.expense.ExpenseCategory;
import com.manaKhata.expense.ExpenseRepository;
import com.manaKhata.expense.ExpenseType;
import com.manaKhata.expense.ExpenseVisibility;
import com.manaKhata.expense.ExpenseSplit;
import com.manaKhata.expense.ExpenseSplitRepository;
import com.manaKhata.grocery.GroceryItem;
import com.manaKhata.grocery.GroceryItemRepository;
import com.manaKhata.grocery.GroceryList;
import com.manaKhata.grocery.GroceryListRepository;
import com.manaKhata.household.Household;
import com.manaKhata.household.HouseholdRepository;
import com.manaKhata.reimbursement.Reimbursement;
import com.manaKhata.reimbursement.ReimbursementRepository;
import com.manaKhata.reimbursement.ReimbursementStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Random;

@Configuration
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "manakhata.seed.enabled", havingValue = "true", matchIfMissing = true)
@SuppressWarnings({"null", "unused"})
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("!test")
    public CommandLineRunner seedData(
            HouseholdRepository householdRepo,
            UserRepository userRepo,
            ExpenseRepository expenseRepo,
            ReimbursementRepository reimbRepo,
            VehicleRepository vehicleRepo,
            VehicleExpenseRepository vExpRepo,
            BudgetRepository budgetRepo,
            ExpenseSplitRepository splitRepo,
            GroceryListRepository groceryListRepo,
            GroceryItemRepository groceryItemRepo
    ) {
        return args -> {
            if (userRepo.count() > 0) {
                log.info("Database already seeded. Skipping...");
                return;
            }

            log.info("Seeding demo data for ManaKhata...");

            // ─── Create Household ─────────────────────────────────────────
            Household household = householdRepo.save(Household.builder()
                    .name("Mario Family")
                    .description("Our beloved household")
                    .address("12, Green Park Colony")
                    .city("New Delhi")
                    .country("India")
                    .currency("INR")
                    .monthlyIncome(200000.0)
                    .inviteCode("MARIO01")
                    .isActive(true)
                    .build());

            // ─── Create Househead ────────────────────────────────────────
            User househead = userRepo.save(User.builder()
                    .fullName("Mario")
                    .email("demo@manaKhata.app")
                    .phone("9876543210")
                    .passwordHash(passwordEncoder.encode("Demo@1234"))
                    .role(UserRole.HOUSEHEAD)
                    .gender(Gender.MALE)
                    .household(household)
                    .isHousehead(true)
                    .monthlyIncome(120000.0)
                    .walletBalance(45000.0)
                    .canViewHousehold(true)
                    .canViewAnalytics(true)
                    .canManageExpenses(true)
                    .isActive(true)
                    .build());

            // ─── Create Family Members ────────────────────────────────────
            User mother = userRepo.save(User.builder()
                    .fullName("Ria")
                    .email("ria@manaKhata.app")
                    .phone("9876543211")
                    .passwordHash(passwordEncoder.encode("Demo@1234"))
                    .role(UserRole.PARENT)
                    .gender(Gender.FEMALE)
                    .household(household)
                    .isHousehead(false)
                    .monthlyIncome(0.0)
                    .walletBalance(15000.0)
                    .canViewHousehold(true)
                    .canViewAnalytics(true)
                    .canManageExpenses(true)
                    .isActive(true)
                    .build());

            User son = userRepo.save(User.builder()
                    .fullName("Max")
                    .email("max@manaKhata.app")
                    .phone("9876543212")
                    .passwordHash(passwordEncoder.encode("Demo@1234"))
                    .role(UserRole.ADULT_CHILD)
                    .gender(Gender.MALE)
                    .household(household)
                    .isHousehead(false)
                    .monthlyIncome(55000.0)
                    .walletBalance(8000.0)
                    .canViewHousehold(false)
                    .canViewAnalytics(false)
                    .canManageExpenses(true)
                    .isActive(true)
                    .build());

            User daughter = userRepo.save(User.builder()
                    .fullName("Lucy")
                    .email("lucy@manaKhata.app")
                    .phone("9876543213")
                    .passwordHash(passwordEncoder.encode("Demo@1234"))
                    .role(UserRole.STUDENT)
                    .gender(Gender.FEMALE)
                    .household(household)
                    .isHousehead(false)
                    .monthlyIncome(0.0)
                    .walletBalance(3000.0)
                    .canViewHousehold(false)
                    .canViewAnalytics(false)
                    .canManageExpenses(true)
                    .isActive(true)
                    .build());

            User jack = userRepo.save(User.builder()
                    .fullName("Jack")
                    .email("jack@manaKhata.app")
                    .phone("9876543214")
                    .passwordHash(passwordEncoder.encode("Demo@1234"))
                    .role(UserRole.STUDENT)
                    .gender(Gender.MALE)
                    .household(household)
                    .isHousehead(false)
                    .monthlyIncome(0.0)
                    .walletBalance(3000.0)
                    .canViewHousehold(false)
                    .canViewAnalytics(false)
                    .canManageExpenses(true)
                    .isActive(true)
                    .build());



            log.info("Users created. Seeding expenses...");

            // ─── Seed Expenses for last 3 months ─────────────────────────
            LocalDate today = LocalDate.now();
            seedMonthExpenses(expenseRepo, househead, son, mother, daughter, jack, household, today);
            seedMonthExpenses(expenseRepo, househead, son, mother, daughter, jack, household, today.minusMonths(1));
            seedMonthExpenses(expenseRepo, househead, son, mother, daughter, jack, household, today.minusMonths(2));

            // ─── Seed Reimbursements ──────────────────────────────────────
            reimbRepo.save(Reimbursement.builder()
                    .payer(son)
                    .household(household)
                    .amount(2500.0)
                    .description("AC repair — technician charges")
                    .category("MAINTENANCE")
                    .paidDate(today.minusDays(5))
                    .status(ReimbursementStatus.PENDING)
                    .isHouseholdExpense(true)
                    .notes("Paid on behalf of household")
                    .build());

            reimbRepo.save(Reimbursement.builder()
                    .payer(daughter)
                    .household(household)
                    .amount(1800.0)
                    .description("Grocery shopping for the week")
                    .category("GROCERIES")
                    .paidDate(today.minusDays(3))
                    .status(ReimbursementStatus.PENDING)
                    .isHouseholdExpense(true)
                    .build());

            reimbRepo.save(Reimbursement.builder()
                    .payer(mother)
                    .household(household)
                    .amount(4200.0)
                    .description("Cook salary for November")
                    .category("HOUSEHOLD")
                    .paidDate(today.minusDays(10))
                    .status(ReimbursementStatus.APPROVED)
                    .approvedBy(househead)
                    .isHouseholdExpense(true)
                    .build());

            reimbRepo.save(Reimbursement.builder()
                    .payer(son)
                    .household(household)
                    .amount(3500.0)
                    .description("Electricity bill — October")
                    .category("ELECTRICITY")
                    .paidDate(today.minusMonths(1).minusDays(5))
                    .status(ReimbursementStatus.SETTLED)
                    .settledDate(today.minusMonths(1))
                    .approvedBy(househead)
                    .isHouseholdExpense(true)
                    .build());

            // ─── Seed Expense Splits (IOUs) ──────────────────────────────────
            Expense sharedGrocery = expenseRepo.save(Expense.builder()
                    .user(househead).household(household)
                    .amount(5000.0).description("Big Bazaar Monthly Haul")
                    .category(ExpenseCategory.GROCERIES).expenseType(ExpenseType.SHARED)
                    .visibility(ExpenseVisibility.HOUSEHOLD).expenseDate(today.minusDays(4))
                    .build());
            
            splitRepo.save(ExpenseSplit.builder()
                    .expense(sharedGrocery).owedBy(son).owedTo(househead)
                    .amount(1250.0).note("Max's share of groceries")
                    .build());
            
            splitRepo.save(ExpenseSplit.builder()
                    .expense(sharedGrocery).owedBy(mother).owedTo(househead)
                    .amount(1250.0).note("Ria's share of groceries")
                    .build());

            Expense movieNight = expenseRepo.save(Expense.builder()
                    .user(son).household(household)
                    .amount(1500.0).description("Avengers Movie Tickets")
                    .category(ExpenseCategory.ENTERTAINMENT).expenseType(ExpenseType.SHARED)
                    .visibility(ExpenseVisibility.PERSONAL).expenseDate(today.minusDays(1))
                    .build());
            
            splitRepo.save(ExpenseSplit.builder()
                    .expense(movieNight).owedBy(jack).owedTo(son)
                    .amount(500.0).note("Jack's movie ticket")
                    .build());

            // ─── Seed Grocery Lists ──────────────────────────────────────────
            GroceryList pendingList = groceryListRepo.save(GroceryList.builder()
                    .name("Weekend BBQ Party")
                    .household(household)
                    .createdBy(househead)
                    .build());
            
            groceryItemRepo.save(GroceryItem.builder().groceryList(pendingList)
                    .name("Chicken Breast").quantity(2).unit("kg").estimatedPrice(600.0).build());
            groceryItemRepo.save(GroceryItem.builder().groceryList(pendingList)
                    .name("BBQ Sauce").quantity(1).unit("bottle").estimatedPrice(150.0).build());
            groceryItemRepo.save(GroceryItem.builder().groceryList(pendingList)
                    .name("Charcoal").quantity(5).unit("kg").estimatedPrice(300.0).build());
            
            GroceryList completedList = groceryListRepo.save(GroceryList.builder()
                    .name("Monthly Staples")
                    .household(household)
                    .createdBy(mother)
                    .isCompleted(true)
                    .build());
            
            groceryItemRepo.save(GroceryItem.builder().groceryList(completedList)
                    .name("Rice").quantity(10).unit("kg").estimatedPrice(750.0).isChecked(true).build());
            groceryItemRepo.save(GroceryItem.builder().groceryList(completedList)
                    .name("Dal").quantity(2).unit("kg").estimatedPrice(240.0).isChecked(true).build());

            // ─── Seed Vehicles ────────────────────────────────────────────
            Vehicle bike = vehicleRepo.save(Vehicle.builder()
                    .owner(househead)
                    .household(household)
                    .name("Mario's Scooty")
                    .registrationNumber("DL-3C-AB-1234")
                    .vehicleType(VehicleType.SCOOTY)
                    .make("Honda")
                    .model("Activa 6G")
                    .year(2021)
                    .fuelType("Petrol")
                    .mileageKmpl(45.0)
                    .insuranceExpiry("2025-03-15")
                    .pucExpiry("2025-01-20")
                    .isShared(true)
                    .totalFuelCost(8500.0)
                    .totalMaintenanceCost(2000.0)
                    .isActive(true)
                    .build());

            Vehicle car = vehicleRepo.save(Vehicle.builder()
                    .owner(househead)
                    .household(household)
                    .name("Family Car")
                    .registrationNumber("DL-3C-CD-5678")
                    .vehicleType(VehicleType.CAR)
                    .make("Maruti Suzuki")
                    .model("Swift Dzire")
                    .year(2020)
                    .fuelType("Petrol")
                    .mileageKmpl(22.0)
                    .insuranceExpiry("2025-06-30")
                    .pucExpiry("2025-02-28")
                    .isShared(true)
                    .totalFuelCost(15000.0)
                    .totalMaintenanceCost(8000.0)
                    .isActive(true)
                    .build());

            Vehicle maxBike = vehicleRepo.save(Vehicle.builder()
                    .owner(son)
                    .household(household)
                    .name("Max's Bike")
                    .registrationNumber("DL-3C-EF-9012")
                    .vehicleType(VehicleType.BIKE)
                    .make("Royal Enfield")
                    .model("Classic 350")
                    .year(2022)
                    .fuelType("Petrol")
                    .mileageKmpl(35.0)
                    .insuranceExpiry("2025-08-10")
                    .pucExpiry("2025-04-12")
                    .isShared(false)
                    .totalFuelCost(5000.0)
                    .totalMaintenanceCost(1000.0)
                    .isActive(true)
                    .build());

            Vehicle jackBike = vehicleRepo.save(Vehicle.builder()
                    .owner(jack)
                    .household(household)
                    .name("Jack's Bike")
                    .registrationNumber("DL-3C-GH-3456")
                    .vehicleType(VehicleType.BIKE)
                    .make("Yamaha")
                    .model("MT-15")
                    .year(2023)
                    .fuelType("Petrol")
                    .mileageKmpl(40.0)
                    .insuranceExpiry("2025-10-15")
                    .pucExpiry("2025-05-20")
                    .isShared(false)
                    .totalFuelCost(3000.0)
                    .totalMaintenanceCost(500.0)
                    .isActive(true)
                    .build());

            // Seed vehicle expenses
            vExpRepo.save(VehicleExpense.builder()
                    .vehicle(bike)
                    .contributor(son)
                    .household(household)
                    .amount(500.0)
                    .description("Petrol fill — 2L")
                    .expenseType(VehicleExpenseType.FUEL)
                    .expenseDate(today.minusDays(2))
                    .fuelLiters(2.0)
                    .build());

            vExpRepo.save(VehicleExpense.builder()
                    .vehicle(car)
                    .contributor(househead)
                    .household(household)
                    .amount(3000.0)
                    .description("Monthly petrol — full tank")
                    .expenseType(VehicleExpenseType.FUEL)
                    .expenseDate(today.minusDays(7))
                    .fuelLiters(12.0)
                    .build());

            vExpRepo.save(VehicleExpense.builder()
                    .vehicle(car)
                    .contributor(househead)
                    .household(household)
                    .amount(5000.0)
                    .description("Annual servicing")
                    .expenseType(VehicleExpenseType.SERVICE)
                    .expenseDate(today.minusMonths(1))
                    .build());

            // ─── Seed Budgets ──────────────────────────────────────────────
            int month = today.getMonthValue();
            int year = today.getYear();

            budgetRepo.save(Budget.builder().user(househead).household(household)
                    .category(ExpenseCategory.GROCERIES).monthlyLimit(10000.0).currentSpent(7200.0)
                    .month(month).year(year).budgetType(BudgetType.HOUSEHOLD).alertAtPercent(80).isActive(true).build());

            budgetRepo.save(Budget.builder().user(househead).household(household)
                    .category(ExpenseCategory.PETROL).monthlyLimit(5000.0).currentSpent(3800.0)
                    .month(month).year(year).budgetType(BudgetType.HOUSEHOLD).alertAtPercent(80).isActive(true).build());

            budgetRepo.save(Budget.builder().user(househead).household(household)
                    .category(ExpenseCategory.ENTERTAINMENT).monthlyLimit(3000.0).currentSpent(2800.0)
                    .month(month).year(year).budgetType(BudgetType.PERSONAL).alertAtPercent(75).isActive(true).build());

            budgetRepo.save(Budget.builder().user(househead).household(household)
                    .category(ExpenseCategory.MEDICAL).monthlyLimit(5000.0).currentSpent(1200.0)
                    .month(month).year(year).budgetType(BudgetType.HOUSEHOLD).alertAtPercent(80).isActive(true).build());

            log.info("✅ ManaKhata demo data seeded successfully!");
            log.info("📧 Demo login: demo@manaKhata.app | Password: Demo@1234");
        };
    }

    private void seedMonthExpenses(
            ExpenseRepository expenseRepo,
            User househead, User son, User mother, User daughter, User jack,
            Household household, LocalDate baseDate
    ) {
        // Househead expenses
        saveExpense(expenseRepo, househead, household, 45000.0, "House Rent", ExpenseCategory.RENT, ExpenseType.FIXED, ExpenseVisibility.HOUSEHOLD, baseDate.withDayOfMonth(1));
        saveExpense(expenseRepo, househead, household, 3200.0, "Electricity bill", ExpenseCategory.ELECTRICITY, ExpenseType.FIXED, ExpenseVisibility.HOUSEHOLD, baseDate.withDayOfMonth(5));
        saveExpense(expenseRepo, househead, household, 1200.0, "Broadband Internet", ExpenseCategory.INTERNET, ExpenseType.FIXED, ExpenseVisibility.HOUSEHOLD, baseDate.withDayOfMonth(5));
        saveExpense(expenseRepo, househead, household, 3000.0, "Monthly petrol", ExpenseCategory.PETROL, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(10));
        saveExpense(expenseRepo, househead, household, 8500.0, "Monthly groceries", ExpenseCategory.GROCERIES, ExpenseType.VARIABLE, ExpenseVisibility.HOUSEHOLD, baseDate.withDayOfMonth(8));
        saveExpense(expenseRepo, househead, household, 2500.0, "Doctor visit + medicines", ExpenseCategory.MEDICAL, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(15));
        saveExpense(expenseRepo, househead, household, 1500.0, "Movie & dining out", ExpenseCategory.ENTERTAINMENT, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(20));
        saveExpense(expenseRepo, househead, household, 5000.0, "SIP — Mutual Fund", ExpenseCategory.INVESTMENT, ExpenseType.FIXED, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(3));

        // Son expenses
        saveExpense(expenseRepo, son, household, 500.0, "Petrol for bike", ExpenseCategory.PETROL, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(2));
        saveExpense(expenseRepo, son, household, 1200.0, "Office lunch & coffee", ExpenseCategory.FOOD, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(12));
        saveExpense(expenseRepo, son, household, 2000.0, "Amazon shopping", ExpenseCategory.SHOPPING, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(18));

        // Mother expenses
        saveExpense(expenseRepo, mother, household, 1800.0, "Vegetables & fruits", ExpenseCategory.GROCERIES, ExpenseType.VARIABLE, ExpenseVisibility.HOUSEHOLD, baseDate.withDayOfMonth(6));
        saveExpense(expenseRepo, mother, household, 800.0, "Temple offering & misc", ExpenseCategory.OTHER, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(14));

        // Daughter expenses
        saveExpense(expenseRepo, daughter, household, 500.0, "College canteen", ExpenseCategory.FOOD, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(10));
        saveExpense(expenseRepo, daughter, household, 1200.0, "Books & stationery", ExpenseCategory.EDUCATION, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(7));

        // Jack expenses
        saveExpense(expenseRepo, jack, household, 300.0, "Movie ticket", ExpenseCategory.ENTERTAINMENT, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(15));
        saveExpense(expenseRepo, jack, household, 800.0, "Petrol for bike", ExpenseCategory.PETROL, ExpenseType.VARIABLE, ExpenseVisibility.PERSONAL, baseDate.withDayOfMonth(22));
    }

    private void saveExpense(ExpenseRepository repo, User user, Household household,
                             Double amount, String desc, ExpenseCategory cat,
                             ExpenseType type, ExpenseVisibility vis, LocalDate date) {
        repo.save(Expense.builder()
                .user(user).household(household)
                .amount(amount).description(desc)
                .category(cat).expenseType(type).visibility(vis)
                .expenseDate(date).isShared(false).isReimbursable(false)
                .paidForHousehold(false)
                .build());
    }
}
