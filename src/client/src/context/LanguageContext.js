import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations object
const translations = {
  en: {
    // NavBar
    tools: 'Tools',
    cart: 'Cart',
    myRentals: 'My Rentals',
    admin: 'Admin',
    contactUs: 'Contact Us',
    logout: 'Logout',
    login: 'Login',
    signUp: 'Sign Up',
    adminPanel: 'Admin Panel',
    users: 'Users',
    overdue: 'Overdue',

    // Home page
    welcomeTitle: 'Welcome to the box',
    welcomeSubtitle: 'Your one-stop shop for tool rentals',
    browseTools: 'Browse Tools',
    featuredTools: 'Featured Tools',
    viewAllTools: 'View All Tools',
    perDay: '/day',
    heroTitle: 'Rent Professional Tools On Demand',
    heroSubtitle: 'Get access to high-quality tools whenever you need them. No long-term commitments, just pay for what you use.',
    getStarted: 'Get Started',
    whyChooseUs: 'Why Choose Us?',
    qualityTools: 'Quality Tools',
    qualityToolsDesc: 'All our tools are regularly maintained and inspected for quality',
    flexibleRental: 'Flexible Rental',
    flexibleRentalDesc: 'Rent by the day with easy online booking and scheduling',
    affordablePrices: 'Affordable Prices',
    affordablePricesDesc: 'Competitive daily rates that save you money compared to buying',
    securePayment: 'Secure Payment',
    securePaymentDesc: 'Safe and secure online payment with instant confirmation',
    howItWorks: 'How It Works',
    step1Title: 'Browse & Select',
    step1Desc: 'Browse our catalog and choose the tool you need',
    step2Title: 'Book & Pay',
    step2Desc: 'Select your dates and complete secure payment online',
    step3Title: 'Pick Up & Use',
    step3Desc: 'Pick up your tool and start your project',
    readyToStart: 'Ready to Get Started?',
    joinThousands: 'Join thousands of satisfied customers renting tools online',

    // Tools page
    allTools: 'All Tools',
    searchTools: 'Search tools...',
    allCategories: 'All Categories',
    noToolsFound: 'No tools found',
    available: 'Available',
    inMaintenance: 'In Maintenance',
    addToCart: 'Add to Cart',

    // Cart
    shoppingCart: 'Shopping Cart',
    emptyCart: 'Your cart is empty',
    startDate: 'Start Date',
    endDate: 'End Date',
    quantity: 'Quantity',
    days: 'days',
    total: 'Total',
    remove: 'Remove',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',

    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    forgotPassword: 'Forgot password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signInToAccount: 'Sign in to your account',
    createAccount: 'Create your account',

    // Dashboard
    reservations: 'Reservations',
    payments: 'Payments',
    noReservations: 'No reservations found',
    status: 'Status',

    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    yes: 'Yes',
    no: 'No',

    // Tools Catalog
    toolCatalog: 'Tool Catalog',
    browseAndRent: 'Browse and rent professional tools',
    checkAvailability: 'Check Tool Availability',
    searchAvailableDates: 'Search for all tools available on specific dates',
    search: 'Search',
    maintenance: 'Maintenance',
    noDescription: 'No description available',
    viewDetails: 'View Details',
    day: 'day',

    // Cart page
    yourCartEmpty: 'Your Cart is Empty',
    cartEmptyMessage: 'Browse our tools catalog and add items to your cart to get started.',
    browseTools: 'Browse Tools',
    itemsInCart: 'items in your cart',
    itemInCart: 'item in your cart',
    duration: 'Duration',
    pricePerDay: 'Price per day',
    tool: 'tool',
    toolsLower: 'tools',
    proceedToCheckout: 'Proceed to Checkout',
    pleaseLoginCheckout: 'Please login to proceed with checkout',

    // Login page
    signInToAccount: 'Sign in to your account',
    loggingIn: 'Logging in...',
    orContinueWith: 'Or continue with',

    // Signup page
    createYourAccount: 'Create your account',
    creatingAccount: 'Creating account...',
    bySigningUp: 'By signing up, you agree to our',
    privacyPolicy: 'Privacy Policy',

    // Tool Details page
    totalStock: 'Total Stock',
    availableStock: 'available',
    availableStockPlural: 'available',
    inStock: 'in stock',
    toolUnavailable: 'This tool is currently unavailable (maintenance mode)',
    description: 'Description',
    bookThisTool: 'Book This Tool',
    selectBothDates: 'Please select both start and end dates',
    endDateAfterStart: 'End date must be after start date',
    howManyTools: 'How many of this tool do you want to rent?',
    totalPrice: 'Total Price',
    checking: 'Checking...',
    checkAvailabilityBtn: 'Check Availability',
    availableForDates: 'Available for these dates!',
    alreadyReserved: 'Already reserved',
    alreadyInCart: 'Already in cart',
    addedToCart: 'Added to Cart!',
    hasBeenAddedToCart: 'has been added to your cart',
    viewCart: 'View Cart',
    itemsHeldUntilCheckout: 'Items will be held in your cart until checkout',
    checkAvailabilityFirst: 'Please check availability first',

    // Checkout page
    checkoutTitle: 'Checkout',
    orderSummary: 'Order Summary',
    paymentInfo: 'Payment Information',
    orderTotal: 'Order Total',
    haveCoupon: 'Have a Coupon?',
    enterCode: 'Enter code',
    apply: 'Apply',
    subtotal: 'Subtotal',
    items: 'items',
    discount: 'Discount',
    tax: 'Tax',
    placeOrder: 'Place Order',
    processing: 'Processing...',
    backToCart: 'Back to Cart',
    cardNumber: 'Card Number',
    cardholderName: 'Cardholder Name',
    expiryDate: 'Expiry Date',
    cvv: 'CVV',
    demoPayment: 'This is a demo. No real payment will be processed.',
    noPaymentRequired: 'No Payment Required',
    couponCoversAll: 'Your coupon covers the full amount. Click "Place Order" to complete your reservation.',
    phoneRequired: 'Phone Number Required',
    phoneRequiredMessage: 'Please add your phone number before checkout. This helps us contact you about your rental.',
    contactNumber: 'Contact Number',
    termsMessage: 'By placing your order, you agree to our terms and conditions.',
    returnMessage: 'Your rental period starts on the date specified and all items must be returned by the end date.',
    off: 'off',

    // Checkout Success page
    orderPlacedSuccessfully: 'Order Placed Successfully!',
    thankYouForOrder: 'Thank you for your order. Your rental reservations have been confirmed.',
    orderItems: 'Order Items',
    item: 'Item',
    itemPlural: 'Items',
    totalAmount: 'Total Amount',
    whatsNext: "What's Next?",
    confirmationEmail: 'Confirmation Email',
    confirmationEmailDesc: 'You will receive an email confirmation with your order details shortly.',
    pickupInstructions: 'Pickup Instructions',
    pickupInstructionsDesc: 'Please bring your confirmation email and ID when picking up your tools on the rental start date.',
    returnPolicy: 'Return Policy',
    returnPolicyDesc: 'All tools must be returned by the end date specified in your reservation. Late returns may incur additional charges.',
    orderDetails: 'Order Details',
    viewMyRentals: 'View My Rentals',
    browseMoreTools: 'Browse More Tools',
    goHome: 'Go Home',

    // Tool Availability page
    checkToolAvailability: 'Check Tool Availability',
    findAvailableTools: 'Find which tools are available for your desired rental dates',
    selectRentalPeriod: 'Select Rental Period',
    selectBothDatesError: 'Please select both start and end dates',
    rentalPeriod: 'Rental Period',
    searchAvailableTools: 'Search Available Tools',
    searching: 'Searching...',
    checkingAvailability: 'Checking tool availability...',
    availableToolsCount: 'Available Tools',
    noToolsForDates: 'No tools available for these dates',
    toolsAvailableForDates: 'tools available for your selected dates',
    toolAvailableForDates: 'tool available for your selected dates',
    noToolsAvailable: 'No Tools Available',
    allToolsBooked: 'All tools are fully booked for the selected dates. Try different dates or check back later.',
    inStockLabel: 'in stock',
    viewDetailsBook: 'View Details & Book',
    forDays: 'for',

    // DatePicker / Calendar
    selectDate: 'Select date',
    allowedDays: 'Allowed days',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sunShort: 'S',
    monShort: 'M',
    tueShort: 'T',
    wedShort: 'W',
    thuShort: 'T',
    friShort: 'F',
    satShort: 'S',
  },
  he: {
    // NavBar
    tools: 'כלים',
    cart: 'עגלה',
    myRentals: 'ההשכרות שלי',
    admin: 'ניהול',
    contactUs: 'צור קשר',
    logout: 'התנתק',
    login: 'התחבר',
    signUp: 'הרשמה',
    adminPanel: 'לוח ניהול',
    users: 'משתמשים',
    overdue: 'באיחור',

    // Home page
    welcomeTitle: 'ברוכים הבאים להקופסא',
    welcomeSubtitle: 'המקום שלך להשכרת כלים',
    browseTools: 'עיין בכלים',
    featuredTools: 'כלים מומלצים',
    viewAllTools: 'צפה בכל הכלים',
    perDay: '/יום',
    heroTitle: 'השכר כלים מקצועיים לפי דרישה',
    heroSubtitle: 'קבל גישה לכלים איכותיים מתי שתצטרך. ללא התחייבות לטווח ארוך, שלם רק על מה שאתה משתמש.',
    getStarted: 'התחל עכשיו',
    whyChooseUs: 'למה לבחור בנו?',
    qualityTools: 'כלים איכותיים',
    qualityToolsDesc: 'כל הכלים שלנו עוברים תחזוקה ובדיקת איכות באופן קבוע',
    flexibleRental: 'השכרה גמישה',
    flexibleRentalDesc: 'השכר ליום עם הזמנה ותזמון קל אונליין',
    affordablePrices: 'מחירים משתלמים',
    affordablePricesDesc: 'תעריפים יומיים תחרותיים שחוסכים לך כסף לעומת קנייה',
    securePayment: 'תשלום מאובטח',
    securePaymentDesc: 'תשלום מקוון בטוח ומאובטח עם אישור מיידי',
    howItWorks: 'איך זה עובד',
    step1Title: 'עיין ובחר',
    step1Desc: 'עיין בקטלוג שלנו ובחר את הכלי שאתה צריך',
    step2Title: 'הזמן ושלם',
    step2Desc: 'בחר תאריכים והשלם תשלום מאובטח אונליין',
    step3Title: 'אסוף והשתמש',
    step3Desc: 'אסוף את הכלי והתחל את הפרויקט שלך',
    readyToStart: 'מוכן להתחיל?',
    joinThousands: 'הצטרף לאלפי לקוחות מרוצים ששוכרים כלים אונליין',

    // Tools page
    allTools: 'כל הכלים',
    searchTools: 'חפש כלים...',
    allCategories: 'כל הקטגוריות',
    noToolsFound: 'לא נמצאו כלים',
    available: 'זמין',
    inMaintenance: 'בתחזוקה',
    addToCart: 'הוסף לעגלה',

    // Cart
    shoppingCart: 'עגלת קניות',
    emptyCart: 'העגלה שלך ריקה',
    startDate: 'תאריך התחלה',
    endDate: 'תאריך סיום',
    quantity: 'כמות',
    days: 'ימים',
    total: 'סה"כ',
    remove: 'הסר',
    checkout: 'לתשלום',
    continueShopping: 'המשך קניות',

    // Auth
    email: 'אימייל',
    password: 'סיסמה',
    confirmPassword: 'אשר סיסמה',
    fullName: 'שם מלא',
    phoneNumber: 'מספר טלפון',
    forgotPassword: 'שכחת סיסמה?',
    dontHaveAccount: 'אין לך חשבון?',
    alreadyHaveAccount: 'יש לך חשבון?',
    signInToAccount: 'התחבר לחשבון שלך',
    createAccount: 'צור חשבון',

    // Dashboard
    reservations: 'הזמנות',
    payments: 'תשלומים',
    noReservations: 'לא נמצאו הזמנות',
    status: 'סטטוס',

    // Common
    loading: 'טוען...',
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    edit: 'ערוך',
    submit: 'שלח',
    back: 'חזור',
    next: 'הבא',
    yes: 'כן',
    no: 'לא',

    // Tools Catalog
    toolCatalog: 'קטלוג כלים',
    browseAndRent: 'עיין והשכר כלים מקצועיים',
    checkAvailability: 'בדוק זמינות כלים',
    searchAvailableDates: 'חפש כלים זמינים בתאריכים מסוימים',
    search: 'חפש',
    maintenance: 'בתחזוקה',
    noDescription: 'אין תיאור זמין',
    viewDetails: 'צפה בפרטים',
    day: 'יום',

    // Cart page
    yourCartEmpty: 'העגלה שלך ריקה',
    cartEmptyMessage: 'עיין בקטלוג הכלים שלנו והוסף פריטים לעגלה כדי להתחיל.',
    browseTools: 'עיין בכלים',
    itemsInCart: 'פריטים בעגלה',
    itemInCart: 'פריט בעגלה',
    duration: 'משך',
    pricePerDay: 'מחיר ליום',
    tool: 'כלי',
    toolsLower: 'כלים',
    proceedToCheckout: 'המשך לתשלום',
    pleaseLoginCheckout: 'אנא התחבר כדי להמשיך לתשלום',

    // Login page
    signInToAccount: 'התחבר לחשבון שלך',
    loggingIn: 'מתחבר...',
    orContinueWith: 'או המשך עם',

    // Signup page
    createYourAccount: 'צור את החשבון שלך',
    creatingAccount: 'יוצר חשבון...',
    bySigningUp: 'בהרשמה, אתה מסכים ל',
    privacyPolicy: 'מדיניות פרטיות',

    // Tool Details page
    totalStock: 'מלאי כולל',
    availableStock: 'זמין',
    availableStockPlural: 'זמינים',
    inStock: 'במלאי',
    toolUnavailable: 'כלי זה אינו זמין כרגע (במצב תחזוקה)',
    description: 'תיאור',
    bookThisTool: 'הזמן כלי זה',
    selectBothDates: 'אנא בחר תאריך התחלה וסיום',
    endDateAfterStart: 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה',
    howManyTools: 'כמה מכלי זה ברצונך לשכור?',
    totalPrice: 'מחיר כולל',
    checking: 'בודק...',
    checkAvailabilityBtn: 'בדוק זמינות',
    availableForDates: 'זמין לתאריכים אלה!',
    alreadyReserved: 'כבר הוזמן',
    alreadyInCart: 'כבר בעגלה',
    addedToCart: 'נוסף לעגלה!',
    hasBeenAddedToCart: 'נוסף לעגלה שלך',
    viewCart: 'צפה בעגלה',
    itemsHeldUntilCheckout: 'הפריטים יישמרו בעגלה עד לתשלום',
    checkAvailabilityFirst: 'אנא בדוק זמינות קודם',

    // Checkout page
    checkoutTitle: 'תשלום',
    orderSummary: 'סיכום הזמנה',
    paymentInfo: 'פרטי תשלום',
    orderTotal: 'סה"כ הזמנה',
    haveCoupon: 'יש לך קופון?',
    enterCode: 'הזן קוד',
    apply: 'החל',
    subtotal: 'סיכום ביניים',
    items: 'פריטים',
    discount: 'הנחה',
    tax: 'מע"מ',
    placeOrder: 'בצע הזמנה',
    processing: 'מעבד...',
    backToCart: 'חזרה לעגלה',
    cardNumber: 'מספר כרטיס',
    cardholderName: 'שם בעל הכרטיס',
    expiryDate: 'תוקף',
    cvv: 'CVV',
    demoPayment: 'זוהי הדגמה. לא יבוצע תשלום אמיתי.',
    noPaymentRequired: 'לא נדרש תשלום',
    couponCoversAll: 'הקופון שלך מכסה את הסכום המלא. לחץ על "בצע הזמנה" להשלמת ההזמנה.',
    phoneRequired: 'נדרש מספר טלפון',
    phoneRequiredMessage: 'אנא הוסף את מספר הטלפון שלך לפני התשלום. זה עוזר לנו ליצור איתך קשר לגבי ההשכרה.',
    contactNumber: 'מספר ליצירת קשר',
    termsMessage: 'בביצוע ההזמנה, אתה מסכים לתנאים וההגבלות שלנו.',
    returnMessage: 'תקופת ההשכרה מתחילה בתאריך שצוין וכל הכלים חייבים להיות מוחזרים עד תאריך הסיום.',
    off: 'הנחה',

    // Checkout Success page
    orderPlacedSuccessfully: 'ההזמנה בוצעה בהצלחה!',
    thankYouForOrder: 'תודה על הזמנתך. הזמנות ההשכרה שלך אושרו.',
    orderItems: 'פריטים בהזמנה',
    item: 'פריט',
    itemPlural: 'פריטים',
    totalAmount: 'סכום כולל',
    whatsNext: 'מה הלאה?',
    confirmationEmail: 'אימייל אישור',
    confirmationEmailDesc: 'תקבל אימייל אישור עם פרטי ההזמנה שלך בקרוב.',
    pickupInstructions: 'הוראות איסוף',
    pickupInstructionsDesc: 'אנא הבא את אימייל האישור ותעודת זהות בעת איסוף הכלים בתאריך תחילת ההשכרה.',
    returnPolicy: 'מדיניות החזרה',
    returnPolicyDesc: 'כל הכלים חייבים להיות מוחזרים עד לתאריך הסיום שצוין בהזמנתך. איחורים בהחזרה עלולים לגרור חיובים נוספים.',
    orderDetails: 'פרטי הזמנה',
    viewMyRentals: 'צפה בהשכרות שלי',
    browseMoreTools: 'עיין בכלים נוספים',
    goHome: 'חזרה לדף הבית',

    // Tool Availability page
    checkToolAvailability: 'בדוק זמינות כלים',
    findAvailableTools: 'מצא אילו כלים זמינים לתאריכי ההשכרה הרצויים',
    selectRentalPeriod: 'בחר תקופת השכרה',
    selectBothDatesError: 'אנא בחר תאריך התחלה וסיום',
    rentalPeriod: 'תקופת השכרה',
    searchAvailableTools: 'חפש כלים זמינים',
    searching: 'מחפש...',
    checkingAvailability: 'בודק זמינות כלים...',
    availableToolsCount: 'כלים זמינים',
    noToolsForDates: 'אין כלים זמינים לתאריכים אלה',
    toolsAvailableForDates: 'כלים זמינים לתאריכים שבחרת',
    toolAvailableForDates: 'כלי זמין לתאריכים שבחרת',
    noToolsAvailable: 'אין כלים זמינים',
    allToolsBooked: 'כל הכלים תפוסים לתאריכים שנבחרו. נסה תאריכים אחרים או בדוק מאוחר יותר.',
    inStockLabel: 'במלאי',
    viewDetailsBook: 'צפה בפרטים והזמן',
    forDays: 'עבור',

    // DatePicker / Calendar
    selectDate: 'בחר תאריך',
    allowedDays: 'ימים מותרים',
    sun: 'ראשון',
    mon: 'שני',
    tue: 'שלישי',
    wed: 'רביעי',
    thu: 'חמישי',
    fri: 'שישי',
    sat: 'שבת',
    sunShort: 'א',
    monShort: 'ב',
    tueShort: 'ג',
    wedShort: 'ד',
    thuShort: 'ה',
    friShort: 'ו',
    satShort: 'ש',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language or default to Hebrew
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'he';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', language);
    // Set document direction based on language
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isHebrew: language === 'he',
        isEnglish: language === 'en'
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
