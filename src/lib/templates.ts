export interface TemplateItem {
  name: string;
  price: number;
  description?: string;
}

export interface TemplateCategory {
  name: string;
  items: TemplateItem[];
}

export interface TakeawayTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  categories: TemplateCategory[];
}

export const takeawayTemplates: TakeawayTemplate[] = [
  {
    id: "indian",
    name: "Indian Takeaway",
    emoji: "🍛",
    description: "Curries, tandoori, rice, naan & sides",
    categories: [
      {
        name: "Starters",
        items: [
          { name: "Onion Bhaji", price: 3.50, description: "Crispy onion fritters" },
          { name: "Samosa (Vegetable)", price: 3.50, description: "2 pieces" },
          { name: "Samosa (Meat)", price: 3.95, description: "2 pieces" },
          { name: "Chicken Tikka Starter", price: 4.50, description: "Marinated & grilled" },
          { name: "Seekh Kebab", price: 4.50, description: "Spiced lamb mince" },
          { name: "Prawn Puri", price: 5.50, description: "Prawns on fried bread" },
          { name: "Poppadoms (Plain)", price: 0.80 },
          { name: "Poppadoms (Spicy)", price: 0.90 },
          { name: "Pickle Tray", price: 2.50, description: "Mango chutney, lime pickle, onion salad, raita" },
        ],
      },
      {
        name: "Chicken Dishes",
        items: [
          { name: "Chicken Tikka Masala", price: 8.95, description: "Mild creamy sauce" },
          { name: "Chicken Korma", price: 8.95, description: "Mild coconut & cream" },
          { name: "Chicken Madras", price: 8.95, description: "Hot & spicy" },
          { name: "Chicken Vindaloo", price: 8.95, description: "Very hot" },
          { name: "Chicken Bhuna", price: 8.95, description: "Medium, thick sauce" },
          { name: "Chicken Jalfrezi", price: 9.50, description: "Hot with peppers & onions" },
          { name: "Chicken Balti", price: 9.50, description: "Medium, balti style" },
          { name: "Butter Chicken", price: 9.50, description: "Rich buttery tomato sauce" },
          { name: "Chicken Saag", price: 8.95, description: "With spinach" },
          { name: "Chicken Pathia", price: 8.95, description: "Hot, sweet & sour" },
        ],
      },
      {
        name: "Lamb Dishes",
        items: [
          { name: "Lamb Rogan Josh", price: 9.50, description: "Medium, tomato based" },
          { name: "Lamb Bhuna", price: 9.50, description: "Medium, thick sauce" },
          { name: "Lamb Madras", price: 9.50, description: "Hot & spicy" },
          { name: "Lamb Korma", price: 9.50, description: "Mild coconut & cream" },
          { name: "Lamb Balti", price: 9.95, description: "Balti style" },
          { name: "Keema Curry", price: 8.95, description: "Minced lamb curry" },
          { name: "Lamb Saag", price: 9.50, description: "With spinach" },
        ],
      },
      {
        name: "Prawn & Fish",
        items: [
          { name: "Prawn Curry", price: 9.50 },
          { name: "Prawn Madras", price: 9.50 },
          { name: "King Prawn Masala", price: 11.95 },
          { name: "King Prawn Jalfrezi", price: 11.95 },
          { name: "Fish Curry", price: 9.50 },
        ],
      },
      {
        name: "Vegetable Dishes",
        items: [
          { name: "Vegetable Curry", price: 7.50 },
          { name: "Chana Masala", price: 7.50, description: "Chickpea curry" },
          { name: "Aloo Gobi", price: 7.50, description: "Potato & cauliflower" },
          { name: "Saag Aloo", price: 7.50, description: "Spinach & potato" },
          { name: "Dal Tarka", price: 7.50, description: "Spiced lentils" },
          { name: "Paneer Tikka Masala", price: 8.50 },
          { name: "Mushroom Bhaji", price: 7.50 },
        ],
      },
      {
        name: "Biryani",
        items: [
          { name: "Chicken Biryani", price: 9.50, description: "With curry sauce" },
          { name: "Lamb Biryani", price: 9.95, description: "With curry sauce" },
          { name: "Prawn Biryani", price: 9.95, description: "With curry sauce" },
          { name: "Vegetable Biryani", price: 8.50, description: "With curry sauce" },
          { name: "King Prawn Biryani", price: 12.50, description: "With curry sauce" },
        ],
      },
      {
        name: "Rice",
        items: [
          { name: "Pilau Rice", price: 2.95 },
          { name: "Boiled Rice", price: 2.50 },
          { name: "Mushroom Rice", price: 3.50 },
          { name: "Egg Fried Rice", price: 3.50 },
          { name: "Keema Rice", price: 3.95 },
          { name: "Special Fried Rice", price: 3.95 },
        ],
      },
      {
        name: "Bread",
        items: [
          { name: "Plain Naan", price: 2.50 },
          { name: "Garlic Naan", price: 2.95 },
          { name: "Peshwari Naan", price: 2.95, description: "Sweet coconut filling" },
          { name: "Keema Naan", price: 3.50, description: "Minced lamb filling" },
          { name: "Cheese Naan", price: 2.95 },
          { name: "Chapati", price: 1.50 },
          { name: "Paratha", price: 2.50 },
        ],
      },
      {
        name: "Sundries",
        items: [
          { name: "Chips", price: 2.50 },
          { name: "Raita", price: 1.95, description: "Yoghurt & cucumber" },
          { name: "Green Salad", price: 2.50 },
          { name: "Mango Chutney", price: 0.80 },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Coca Cola", price: 1.50 },
          { name: "Diet Coke", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Fanta", price: 1.50 },
          { name: "Water", price: 1.00 },
          { name: "Mango Lassi", price: 2.95 },
        ],
      },
    ],
  },
  {
    id: "chinese",
    name: "Chinese Takeaway",
    emoji: "🥡",
    description: "Chow mein, rice dishes, crispy duck & more",
    categories: [
      {
        name: "Starters",
        items: [
          { name: "Spring Rolls (4)", price: 3.80 },
          { name: "Prawn Toast", price: 4.50 },
          { name: "Chicken Satay (4)", price: 4.95 },
          { name: "Crispy Wontons (6)", price: 4.50 },
          { name: "Spare Ribs (Dry)", price: 5.95 },
          { name: "Spare Ribs (BBQ Sauce)", price: 5.95 },
          { name: "Salt & Pepper Chicken Wings", price: 5.50 },
          { name: "Sesame Prawn Toast", price: 4.95 },
          { name: "Crispy Seaweed", price: 3.95 },
          { name: "Prawn Crackers", price: 2.50 },
        ],
      },
      {
        name: "Crispy Duck",
        items: [
          { name: "Crispy Aromatic Duck (Quarter)", price: 8.95, description: "With pancakes, cucumber, spring onion & hoisin" },
          { name: "Crispy Aromatic Duck (Half)", price: 16.50, description: "With pancakes, cucumber, spring onion & hoisin" },
          { name: "Crispy Aromatic Duck (Whole)", price: 29.95, description: "With pancakes, cucumber, spring onion & hoisin" },
        ],
      },
      {
        name: "Chicken Dishes",
        items: [
          { name: "Chicken Chow Mein", price: 7.50 },
          { name: "Chicken Fried Rice", price: 7.50 },
          { name: "Chicken Curry", price: 7.50 },
          { name: "Chicken in Black Bean Sauce", price: 7.95 },
          { name: "Sweet & Sour Chicken Balls", price: 7.50 },
          { name: "Sweet & Sour Chicken (HK Style)", price: 7.95 },
          { name: "Chicken with Cashew Nuts", price: 7.95 },
          { name: "Kung Po Chicken", price: 7.95 },
          { name: "Lemon Chicken", price: 7.95 },
          { name: "Chicken with Mushrooms", price: 7.50 },
          { name: "Salt & Pepper Chicken", price: 7.95 },
          { name: "Crispy Chilli Chicken", price: 7.95 },
        ],
      },
      {
        name: "Beef Dishes",
        items: [
          { name: "Beef Chow Mein", price: 7.50 },
          { name: "Beef Fried Rice", price: 7.50 },
          { name: "Beef Curry", price: 7.50 },
          { name: "Beef in Black Bean Sauce", price: 7.95 },
          { name: "Beef with Mushrooms", price: 7.50 },
          { name: "Crispy Shredded Beef", price: 8.50 },
          { name: "Beef in Oyster Sauce", price: 7.95 },
          { name: "Pepper Beef", price: 7.95 },
        ],
      },
      {
        name: "Pork Dishes",
        items: [
          { name: "Sweet & Sour Pork Balls", price: 7.50 },
          { name: "Sweet & Sour Pork (HK Style)", price: 7.95 },
          { name: "Char Siu (BBQ Pork)", price: 7.50 },
          { name: "Pork Chow Mein", price: 7.50 },
        ],
      },
      {
        name: "Prawn & King Prawn",
        items: [
          { name: "Prawn Chow Mein", price: 7.95 },
          { name: "Prawn Fried Rice", price: 7.95 },
          { name: "Prawn Curry", price: 7.95 },
          { name: "King Prawn in Black Bean Sauce", price: 9.50 },
          { name: "King Prawn with Cashew Nuts", price: 9.50 },
          { name: "Salt & Pepper King Prawns", price: 9.50 },
          { name: "Sweet & Sour King Prawns", price: 9.50 },
        ],
      },
      {
        name: "Vegetable Dishes",
        items: [
          { name: "Vegetable Chow Mein", price: 6.50 },
          { name: "Vegetable Fried Rice", price: 6.50 },
          { name: "Vegetable Curry", price: 6.50 },
          { name: "Tofu in Black Bean Sauce", price: 6.95 },
          { name: "Mixed Vegetables in Garlic", price: 6.50 },
          { name: "Salt & Pepper Tofu", price: 6.95 },
        ],
      },
      {
        name: "Rice & Noodles",
        items: [
          { name: "Boiled Rice", price: 2.50 },
          { name: "Egg Fried Rice", price: 3.00 },
          { name: "Special Fried Rice", price: 6.50 },
          { name: "Yeung Chow Fried Rice", price: 6.95 },
          { name: "Singapore Fried Rice", price: 6.95, description: "Spicy" },
          { name: "Chips", price: 2.50 },
          { name: "Salt & Pepper Chips", price: 3.50 },
          { name: "Singapore Noodles", price: 6.95, description: "Spicy vermicelli" },
          { name: "Chow Mein (Plain)", price: 5.50 },
        ],
      },
      {
        name: "Set Meals",
        items: [
          { name: "Meal for One", price: 9.95, description: "Spring roll, sweet & sour chicken, egg fried rice" },
          { name: "Meal for Two", price: 18.95, description: "Spring rolls, ribs, sweet & sour chicken, beef chow mein, egg fried rice" },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Coca Cola", price: 1.50 },
          { name: "Diet Coke", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Fanta", price: 1.50 },
          { name: "Water", price: 1.00 },
        ],
      },
    ],
  },
  {
    id: "pizza",
    name: "Pizza & Pasta",
    emoji: "🍕",
    description: "Pizzas, pasta, garlic bread & sides",
    categories: [
      {
        name: "Pizzas (10\")",
        items: [
          { name: "Margherita", price: 6.99, description: "Tomato & mozzarella" },
          { name: "Pepperoni", price: 7.99, description: "Pepperoni & mozzarella" },
          { name: "Hawaiian", price: 7.99, description: "Ham & pineapple" },
          { name: "BBQ Chicken", price: 8.99, description: "Chicken, BBQ sauce, onion" },
          { name: "Meat Feast", price: 9.49, description: "Pepperoni, ham, beef, sausage" },
          { name: "Veggie Supreme", price: 8.49, description: "Peppers, mushrooms, onion, sweetcorn" },
          { name: "Chicken Tikka", price: 8.99, description: "Tikka chicken, peppers, onion" },
          { name: "Doner Pizza", price: 8.99, description: "Doner meat, onion" },
        ],
      },
      {
        name: "Pizzas (12\")",
        items: [
          { name: "Margherita (12\")", price: 8.99 },
          { name: "Pepperoni (12\")", price: 9.99 },
          { name: "Hawaiian (12\")", price: 9.99 },
          { name: "BBQ Chicken (12\")", price: 10.99 },
          { name: "Meat Feast (12\")", price: 11.49 },
          { name: "Veggie Supreme (12\")", price: 10.49 },
          { name: "Chicken Tikka (12\")", price: 10.99 },
          { name: "Doner Pizza (12\")", price: 10.99 },
        ],
      },
      {
        name: "Pasta",
        items: [
          { name: "Spaghetti Bolognese", price: 7.49 },
          { name: "Chicken Pasta Bake", price: 7.99 },
          { name: "Penne Arrabiata", price: 7.49, description: "Spicy tomato" },
          { name: "Lasagne", price: 7.99 },
          { name: "Carbonara", price: 7.99 },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Garlic Bread", price: 2.99 },
          { name: "Garlic Bread with Cheese", price: 3.49 },
          { name: "Chips", price: 2.50 },
          { name: "Cheesy Chips", price: 3.50 },
          { name: "Coleslaw", price: 1.50 },
          { name: "Chicken Wings (6)", price: 4.50 },
          { name: "Wedges", price: 3.50 },
          { name: "Onion Rings", price: 2.99 },
          { name: "Dough Balls (8)", price: 3.50, description: "With garlic butter" },
        ],
      },
      {
        name: "Dips & Extras",
        items: [
          { name: "Garlic & Herb Dip", price: 0.60 },
          { name: "BBQ Dip", price: 0.60 },
          { name: "Chilli Dip", price: 0.60 },
          { name: "Sweet Chilli Dip", price: 0.60 },
          { name: "Extra Cheese Topping", price: 1.00 },
          { name: "Extra Topping", price: 0.80 },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Coca Cola", price: 1.50 },
          { name: "Diet Coke", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Fanta", price: 1.50 },
          { name: "Water", price: 1.00 },
          { name: "1.5L Coca Cola", price: 2.99 },
        ],
      },
    ],
  },
  {
    id: "kebab",
    name: "Kebab House",
    emoji: "🥙",
    description: "Kebabs, wraps, burgers & chips",
    categories: [
      {
        name: "Kebabs",
        items: [
          { name: "Doner Kebab (Small)", price: 5.50 },
          { name: "Doner Kebab (Large)", price: 7.50 },
          { name: "Chicken Doner (Small)", price: 5.99 },
          { name: "Chicken Doner (Large)", price: 7.99 },
          { name: "Mixed Doner (Small)", price: 6.50 },
          { name: "Mixed Doner (Large)", price: 8.50 },
          { name: "Chicken Shish Kebab", price: 8.99, description: "Chargrilled chicken cubes" },
          { name: "Lamb Shish Kebab", price: 9.50, description: "Chargrilled lamb cubes" },
          { name: "Adana Kebab", price: 8.99, description: "Spiced minced lamb, chargrilled" },
          { name: "Mixed Grill Kebab", price: 11.99, description: "Shish, doner, kofte, wings" },
        ],
      },
      {
        name: "Wraps",
        items: [
          { name: "Doner Wrap", price: 5.99 },
          { name: "Chicken Doner Wrap", price: 6.49 },
          { name: "Chicken Shish Wrap", price: 7.49 },
          { name: "Falafel Wrap", price: 5.99 },
          { name: "Halloumi Wrap", price: 6.49 },
        ],
      },
      {
        name: "Burgers",
        items: [
          { name: "Cheese Burger", price: 4.99 },
          { name: "Chicken Burger", price: 5.49 },
          { name: "Doner Burger", price: 5.99 },
          { name: "Veggie Burger", price: 4.99 },
          { name: "Double Cheese Burger", price: 6.49 },
        ],
      },
      {
        name: "Fried Chicken",
        items: [
          { name: "2pc Chicken & Chips", price: 4.50 },
          { name: "3pc Chicken & Chips", price: 5.50 },
          { name: "Chicken Strips (5) & Chips", price: 5.50 },
          { name: "Chicken Wings (6) & Chips", price: 5.50 },
          { name: "Family Bucket (8pc)", price: 12.99, description: "8 pieces, 4 wings, 2 chips, coleslaw, drink" },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Chips (Regular)", price: 2.00 },
          { name: "Chips (Large)", price: 3.00 },
          { name: "Cheesy Chips", price: 3.50 },
          { name: "Garlic Bread", price: 2.50 },
          { name: "Onion Rings", price: 2.50 },
          { name: "Coleslaw", price: 1.50 },
          { name: "Salad", price: 2.50 },
          { name: "Pitta Bread", price: 1.00 },
          { name: "Hummus", price: 2.50 },
        ],
      },
      {
        name: "Sauces",
        items: [
          { name: "Chilli Sauce", price: 0.50 },
          { name: "Garlic Sauce", price: 0.50 },
          { name: "BBQ Sauce", price: 0.50 },
          { name: "Mayo", price: 0.50 },
          { name: "Ketchup", price: 0.50 },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Coca Cola", price: 1.50 },
          { name: "Diet Coke", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Fanta", price: 1.50 },
          { name: "Water", price: 1.00 },
          { name: "Ayran", price: 1.50 },
        ],
      },
    ],
  },
  {
    id: "fish_chips",
    name: "Fish & Chips",
    emoji: "🐟",
    description: "Traditional fish & chips, pies & more",
    categories: [
      {
        name: "Fish",
        items: [
          { name: "Cod & Chips (Regular)", price: 7.50 },
          { name: "Cod & Chips (Large)", price: 9.50 },
          { name: "Haddock & Chips (Regular)", price: 7.95 },
          { name: "Haddock & Chips (Large)", price: 9.95 },
          { name: "Plaice & Chips", price: 7.50 },
          { name: "Scampi & Chips (10pc)", price: 7.50 },
          { name: "Fish Cake & Chips", price: 5.50 },
          { name: "Battered Sausage & Chips", price: 5.50 },
          { name: "Fish Finger & Chips (5pc)", price: 5.50 },
        ],
      },
      {
        name: "Pies & Puddings",
        items: [
          { name: "Meat Pie & Chips", price: 5.95 },
          { name: "Chicken Pie & Chips", price: 5.95 },
          { name: "Steak & Kidney Pie & Chips", price: 5.95 },
          { name: "Cheese & Onion Pie & Chips", price: 5.50 },
        ],
      },
      {
        name: "Chips & Sides",
        items: [
          { name: "Chips (Small)", price: 2.00 },
          { name: "Chips (Regular)", price: 2.80 },
          { name: "Chips (Large)", price: 3.50 },
          { name: "Cheesy Chips", price: 3.80 },
          { name: "Chips & Gravy", price: 3.50 },
          { name: "Chips, Cheese & Gravy", price: 4.50 },
          { name: "Curry Sauce & Chips", price: 3.80 },
          { name: "Mushy Peas", price: 1.50 },
          { name: "Gravy", price: 1.00 },
          { name: "Curry Sauce", price: 1.50 },
          { name: "Bread & Butter", price: 0.80 },
        ],
      },
      {
        name: "Kids Meals",
        items: [
          { name: "Kids Fish & Chips", price: 4.50 },
          { name: "Kids Sausage & Chips", price: 3.95 },
          { name: "Kids Chicken Nuggets & Chips", price: 3.95 },
          { name: "Kids Scampi & Chips", price: 4.50 },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Coca Cola", price: 1.50 },
          { name: "Diet Coke", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Fanta", price: 1.50 },
          { name: "Water", price: 1.00 },
          { name: "Tea", price: 1.50 },
          { name: "Coffee", price: 1.80 },
        ],
      },
    ],
  },
  {
    id: "burger",
    name: "Burger Joint",
    emoji: "🍔",
    description: "Burgers, loaded fries, milkshakes",
    categories: [
      {
        name: "Classic Burgers",
        items: [
          { name: "Classic Burger", price: 5.99, description: "Beef patty, lettuce, tomato, onion" },
          { name: "Cheese Burger", price: 6.49, description: "With American cheese" },
          { name: "Bacon Cheese Burger", price: 7.49, description: "Smoked bacon & cheese" },
          { name: "Double Burger", price: 8.49, description: "Two beef patties" },
          { name: "Double Bacon Cheese", price: 9.49, description: "Two patties, bacon, cheese" },
          { name: "BBQ Burger", price: 7.49, description: "BBQ sauce, onion rings, cheese" },
        ],
      },
      {
        name: "Chicken Burgers",
        items: [
          { name: "Grilled Chicken Burger", price: 6.49 },
          { name: "Crispy Chicken Burger", price: 6.49 },
          { name: "Spicy Chicken Burger", price: 6.99 },
          { name: "Chicken Club Burger", price: 7.49, description: "Bacon, cheese, mayo" },
        ],
      },
      {
        name: "Speciality Burgers",
        items: [
          { name: "Halloumi Burger", price: 6.99 },
          { name: "Veggie Burger", price: 5.99, description: "Bean patty" },
          { name: "Doner Burger", price: 6.99 },
          { name: "Tower Burger", price: 9.99, description: "Beef, chicken, onion ring, cheese, bacon" },
        ],
      },
      {
        name: "Meal Deals",
        items: [
          { name: "Burger Meal (Classic)", price: 8.49, description: "Burger, fries & drink" },
          { name: "Burger Meal (Cheese)", price: 8.99, description: "Cheeseburger, fries & drink" },
          { name: "Burger Meal (Double)", price: 10.99, description: "Double burger, fries & drink" },
        ],
      },
      {
        name: "Fries & Sides",
        items: [
          { name: "Regular Fries", price: 2.50 },
          { name: "Large Fries", price: 3.50 },
          { name: "Cheesy Fries", price: 3.99 },
          { name: "Loaded Fries", price: 5.49, description: "Cheese, bacon, jalapenos, sauce" },
          { name: "Onion Rings", price: 2.99 },
          { name: "Chicken Wings (6)", price: 4.99 },
          { name: "Mozzarella Sticks (6)", price: 3.99 },
          { name: "Coleslaw", price: 1.50 },
        ],
      },
      {
        name: "Drinks & Shakes",
        items: [
          { name: "Coca Cola", price: 1.50 },
          { name: "Diet Coke", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Fanta", price: 1.50 },
          { name: "Water", price: 1.00 },
          { name: "Chocolate Milkshake", price: 3.50 },
          { name: "Strawberry Milkshake", price: 3.50 },
          { name: "Vanilla Milkshake", price: 3.50 },
          { name: "Oreo Milkshake", price: 3.95 },
        ],
      },
    ],
  },
  {
    id: "thai",
    name: "Thai Kitchen",
    emoji: "🍜",
    description: "Curries, stir-fries, noodle soups & rice",
    categories: [
      {
        name: "Starters",
        items: [
          { name: "Thai Spring Rolls (4)", price: 4.50 },
          { name: "Chicken Satay (4)", price: 5.50, description: "With peanut sauce" },
          { name: "Prawn Tempura", price: 5.95 },
          { name: "Thai Fish Cakes (4)", price: 5.50 },
          { name: "Tom Yum Soup", price: 5.50, description: "Hot & sour prawn soup" },
          { name: "Tom Kha Soup", price: 5.50, description: "Coconut chicken soup" },
          { name: "Crispy Wontons", price: 4.50 },
        ],
      },
      {
        name: "Thai Curries",
        items: [
          { name: "Green Curry (Chicken)", price: 8.95, description: "Thai green chilli, coconut milk" },
          { name: "Red Curry (Chicken)", price: 8.95, description: "Thai red chilli, coconut milk" },
          { name: "Massaman Curry (Chicken)", price: 8.95, description: "Peanut, potato, coconut" },
          { name: "Panang Curry (Chicken)", price: 8.95 },
          { name: "Green Curry (Prawn)", price: 9.95 },
          { name: "Red Curry (Beef)", price: 9.50 },
          { name: "Yellow Curry (Vegetable)", price: 7.95 },
        ],
      },
      {
        name: "Stir-Fries",
        items: [
          { name: "Pad Thai (Chicken)", price: 8.95, description: "Rice noodles, peanuts, bean sprouts" },
          { name: "Pad Thai (Prawn)", price: 9.95 },
          { name: "Chicken Cashew Nut", price: 8.95 },
          { name: "Thai Basil Chicken", price: 8.95 },
          { name: "Sweet Chilli Chicken", price: 8.50 },
          { name: "Beef in Oyster Sauce", price: 8.95 },
        ],
      },
      {
        name: "Noodles & Rice",
        items: [
          { name: "Thai Fried Rice (Chicken)", price: 7.95 },
          { name: "Thai Fried Rice (Prawn)", price: 8.95 },
          { name: "Steamed Jasmine Rice", price: 2.50 },
          { name: "Coconut Rice", price: 3.00 },
          { name: "Egg Fried Rice", price: 3.00 },
          { name: "Pad See Ew (Chicken)", price: 8.50, description: "Flat noodles, soy sauce" },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Thai Iced Tea", price: 2.95 },
          { name: "Coconut Water", price: 2.50 },
          { name: "Coca Cola", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Water", price: 1.00 },
        ],
      },
    ],
  },
  {
    id: "turkish",
    name: "Turkish Grill",
    emoji: "🫓",
    description: "Grilled meats, mezze, flatbreads & salads",
    categories: [
      {
        name: "Mezze & Starters",
        items: [
          { name: "Hummus", price: 3.95, description: "With warm flatbread" },
          { name: "Baba Ganoush", price: 3.95, description: "Smoky aubergine dip" },
          { name: "Falafel (5pc)", price: 4.50 },
          { name: "Halloumi Fries", price: 4.95 },
          { name: "Sigara Borek (4pc)", price: 4.50, description: "Filo pastry, cheese" },
          { name: "Soup of the Day", price: 3.95 },
          { name: "Mixed Mezze Platter", price: 8.95, description: "Hummus, baba ganoush, falafel, bread" },
        ],
      },
      {
        name: "Kebab Platters",
        items: [
          { name: "Chicken Shish Platter", price: 10.95, description: "With rice, salad & bread" },
          { name: "Lamb Shish Platter", price: 11.95, description: "With rice, salad & bread" },
          { name: "Adana Platter", price: 10.95, description: "Spiced lamb, rice, salad, bread" },
          { name: "Mixed Grill Platter", price: 14.95, description: "Chicken shish, lamb shish, adana, wings" },
          { name: "Iskender Kebab", price: 11.95, description: "Doner on bread with tomato sauce & yoghurt" },
        ],
      },
      {
        name: "Wraps & Doners",
        items: [
          { name: "Chicken Doner Wrap", price: 6.49 },
          { name: "Lamb Doner Wrap", price: 6.49 },
          { name: "Chicken Shish Wrap", price: 7.49 },
          { name: "Falafel Wrap", price: 5.99 },
          { name: "Halloumi Wrap", price: 6.49 },
          { name: "Doner Kebab in Pitta", price: 5.99 },
        ],
      },
      {
        name: "Pides (Turkish Pizza)",
        items: [
          { name: "Cheese Pide", price: 7.95 },
          { name: "Minced Lamb Pide", price: 8.95 },
          { name: "Chicken Pide", price: 8.95 },
          { name: "Mixed Pide", price: 9.95 },
          { name: "Spinach & Cheese Pide", price: 7.95 },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Chips", price: 2.50 },
          { name: "Rice", price: 2.50 },
          { name: "Salad", price: 2.50 },
          { name: "Flatbread", price: 1.50 },
          { name: "Grilled Vegetables", price: 3.50 },
          { name: "Yoghurt", price: 1.50 },
        ],
      },
      {
        name: "Drinks",
        items: [
          { name: "Ayran", price: 1.50 },
          { name: "Turkish Tea", price: 1.50 },
          { name: "Coca Cola", price: 1.50 },
          { name: "Sprite", price: 1.50 },
          { name: "Water", price: 1.00 },
        ],
      },
    ],
  },
  {
    id: "blank",
    name: "Start from Scratch",
    emoji: "📝",
    description: "Empty menu — build your own from scratch",
    categories: [],
  },
];
