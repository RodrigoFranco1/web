/**
 * D38 SECURITY LABS - OPTIMIZED JAVASCRIPT
 *
 * JavaScript optimizado para SEO, Accesibilidad (WCAG 2.1 AA),
 * Performance (Core Web Vitals) y Escalabilidad
 *
 * Características:
 * - Modular con controladores separados
 * - Sanitización robusta de inputs
 * - Validación accesible de formularios
 * - Tracking de eventos preparado
 * - Gestión de estados sin bloqueo de render
 *
 * @author D38 Security Labs
 * @version 2.0.1 - Carrusel Corregido
 */

"use strict";

/* ===== CONFIGURACIÓN GLOBAL ===== */
const CONFIG = {
  // Endpoints - Cambiar en producción
  API_ENDPOINT: "/api/contact",
  CALENDLY_URL: "https://calendly.com/d38-security-labs",
  PENTRAX_URL: "https://pentrax.d38labs.com",

  // Analytics - Configurar cuando tengas los IDs
  ANALYTICS_ID: "G-XXXXXXXXXX",
  GTM_ID: "GTM-XXXXXXX",

  // Configuración de comportamiento
  DEBUG_MODE: true, // Cambiar a false en producción
  ANIMATION_ENABLED: true,
  FORM_TIMEOUT: 30000, // 30 segundos timeout para formularios

  // Rate limiting
  FORM_SUBMIT_COOLDOWN: 3000, // 3 segundos entre envíos

  // Mensajes de usuario
  MESSAGES: {
    FORM_SUCCESS:
      "¡Gracias! Tu solicitud ha sido enviada correctamente. Te contactaremos pronto.",
    FORM_ERROR:
      "Error al enviar el formulario. Por favor, inténtalo de nuevo o contáctanos directamente.",
    FORM_TIMEOUT:
      "El envío está tardando más de lo esperado. Por favor, inténtalo de nuevo.",
    VALIDATION_EMAIL: "Por favor, ingresa un email válido.",
    VALIDATION_REQUIRED: "Este campo es obligatorio.",
    VALIDATION_MIN_LENGTH: "Este campo debe tener al menos {min} caracteres.",
    CALENDLY_PENDING:
      "Integración con calendario próximamente. Contáctanos directamente.",
    PENTRAX_ACTIVATED: "PentraX ha sido activado. Redirigiendo...",
  },
};

/* ===== UTILIDADES CORE ===== */
class Utils {
  /**
   * Logging seguro para desarrollo
   * @param {string} level - Nivel del log (info, warn, error)
   * @param {string} message - Mensaje
   * @param {*} data - Datos adicionales
   */
  static log(level, message, data = null) {
    if (!CONFIG.DEBUG_MODE) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[D38-${timestamp}] ${message}`;

    switch (level) {
      case "error":
        console.error(logMessage, data);
        break;
      case "warn":
        console.warn(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }

  /**
   * Sanitización robusta de inputs
   * @param {string} input - String a sanitizar
   * @param {object} options - Opciones de sanitización
   * @returns {string} String sanitizado
   */
  static sanitizeInput(input, options = {}) {
    if (!input || typeof input !== "string") return "";

    const {
      maxLength = 1000,
      allowHTML = false,
      trimWhitespace = true,
    } = options;

    let sanitized = input;

    // Trim whitespace si está habilitado
    if (trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Limitar longitud
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Sanitizar HTML si no está permitido
    if (!allowHTML) {
      const div = document.createElement("div");
      div.textContent = sanitized;
      sanitized = div.innerHTML;
    }

    return sanitized;
  }

  /**
   * Validación de email mejorada
   * @param {string} email - Email a validar
   * @returns {boolean} Válido o no
   */
  static isValidEmail(email) {
    // RFC 5322 simplified regex
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Debounce optimizado para performance
   * @param {Function} func - Función a debounce
   * @param {number} wait - Tiempo de espera
   * @param {boolean} immediate - Ejecutar inmediatamente
   * @returns {Function} Función debounced
   */
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Throttle para eventos de scroll
   * @param {Function} func - Función a throttle
   * @param {number} limit - Límite de tiempo
   * @returns {Function} Función throttled
   */
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Verificar si prefers-reduced-motion está activo
   * @returns {boolean} Usuario prefiere movimiento reducido
   */
  static prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Crear un elemento con atributos y contenido
   * @param {string} tag - Tag del elemento
   * @param {object} attributes - Atributos del elemento
   * @param {string} content - Contenido del elemento
   * @returns {HTMLElement} Elemento creado
   */
  static createElement(tag, attributes = {}, content = "") {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content) {
      element.textContent = content;
    }

    return element;
  }
}

/* ===== ROTATING SERVICES CAROUSEL CONTROLLER - VERSIÓN CORREGIDA ===== */
class RotatingServicesCarousel {
  constructor(element) {
    this.carousel = element;
    this.track = this.carousel.querySelector(".rotating-carousel__track");
    this.cards = this.track.querySelectorAll(".rotating-service-card");
    this.indicators = this.carousel.querySelectorAll(
      ".rotating-carousel__indicator"
    );
    this.prevBtn = this.carousel.querySelector(".rotating-carousel__nav--prev");
    this.nextBtn = this.carousel.querySelector(".rotating-carousel__nav--next");
    this.autoplayBtn = this.carousel.querySelector("#autoplay-toggle");

    this.totalServices = this.cards.length;
    this.centerIndex = 0;
    this.isRotating = false;
    this.isAutoPlaying = true;
    this.autoplayInterval = null;
    this.autoplayDelay = 5000;

    this.serviceNames = [
      "Red Team Operations",
      "Pentesting Especializado",
      "Threat Intelligence",
    ];
    this.serviceTypes = ["redteam", "pentesting", "threatintel"];
    this.positionClasses = [
      "rotating-service-card--left",
      "rotating-service-card--center",
      "rotating-service-card--right",
    ];

    this.init();
  }

  init() {
    if (!this.carousel) {
      Utils.log("warn", "Rotating carousel element not found");
      return;
    }

    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupTouchNavigation();
    this.setupAccessibility();
    this.startAutoplay();
    this.updateIndicators();

    Utils.log("info", "Rotating Services Carousel initialized");
  }

  setupEventListeners() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => this.rotateLeft());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.rotateRight());
    }

    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.focusService(index));
    });

    if (this.autoplayBtn) {
      this.autoplayBtn.addEventListener("click", () => this.toggleAutoplay());
    }

    this.cards.forEach((card, index) => {
      card.addEventListener("click", (e) => {
        if (index !== this.centerIndex && !e.target.closest(".btn")) {
          e.preventDefault();
          this.focusService(index);
        }
      });
    });

    this.carousel.addEventListener("mouseenter", () => this.pauseAutoplay());
    this.carousel.addEventListener("mouseleave", () => this.resumeAutoplay());
    this.carousel.addEventListener("focusin", () => this.pauseAutoplay());
    this.carousel.addEventListener("focusout", (e) => {
      if (!this.carousel.contains(e.relatedTarget)) {
        this.resumeAutoplay();
      }
    });
  }

  setupKeyboardNavigation() {
    this.carousel.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          this.rotateLeft();
          break;
        case "ArrowRight":
          e.preventDefault();
          this.rotateRight();
          break;
        case " ":
          e.preventDefault();
          this.toggleAutoplay();
          break;
        case "Home":
          e.preventDefault();
          this.focusService(0);
          break;
        case "End":
          e.preventDefault();
          this.focusService(this.totalServices - 1);
          break;
      }
    });
  }

  setupTouchNavigation() {
    let startX = 0;
    let endX = 0;

    this.track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        this.pauseAutoplay();
      },
      { passive: true }
    );

    this.track.addEventListener(
      "touchend",
      (e) => {
        endX = e.changedTouches[0].clientX;
        const deltaX = startX - endX;
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            this.rotateRight();
          } else {
            this.rotateLeft();
          }
        }
        this.resumeAutoplay();
      },
      { passive: true }
    );
  }

  setupAccessibility() {
    this.carousel.setAttribute("aria-roledescription", "carousel");
    this.track.setAttribute("aria-live", "polite");

    this.cards.forEach((card, index) => {
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute(
        "aria-label",
        `${index + 1} de ${this.totalServices}: ${this.serviceNames[index]}`
      );
    });

    this.announceCurrentService();
  }

  rotateRight() {
    if (this.isRotating) return;

    Utils.log("info", "Rotating carousel right");
    this.centerIndex = (this.centerIndex + 1) % this.totalServices;
    this.performRotation("right");
  }

  rotateLeft() {
    if (this.isRotating) return;

    Utils.log("info", "Rotating carousel left");
    this.centerIndex =
      this.centerIndex === 0 ? this.totalServices - 1 : this.centerIndex - 1;
    this.performRotation("left");
  }

  focusService(serviceIndex) {
    if (this.isRotating || serviceIndex === this.centerIndex) return;

    Utils.log("info", `Focusing service: ${serviceIndex}`);
    this.centerIndex = serviceIndex;
    this.performRotation("focus");
  }

  // MÉTODO CORREGIDO - VALORES DEL PROTOTIPO FUNCIONAL
  performRotation(direction = "right") {
    this.isRotating = true;

    // Añadir clase de rotación para animación mejorada
    this.cards.forEach((card) =>
      card.classList.add("rotating-service-card--rotating")
    );

    this.cards.forEach((card, index) => {
      // Limpiar todas las clases de posición
      this.positionClasses.forEach((pos) => card.classList.remove(pos));

      // Calcular posición relativa desde el centro
      const relativePosition =
        (index - this.centerIndex + this.totalServices) % this.totalServices;

      // Aplicar clases de posición usando la lógica del prototipo funcional
      if (relativePosition === 0) {
        // Tarjeta central
        card.classList.add("rotating-service-card--center");
        card.setAttribute("aria-current", "true");
      } else if (relativePosition === 1) {
        // Tarjeta derecha
        card.classList.add("rotating-service-card--right");
        card.removeAttribute("aria-current");
      } else if (relativePosition === 2 || relativePosition === this.totalServices - 1) {
        // Tarjeta izquierda (incluye el caso de 3 servicios donde relativePosition 2 es la izquierda)
        card.classList.add("rotating-service-card--left");
        card.removeAttribute("aria-current");
      }
    });

    this.updateIndicators();
    this.announceCurrentService();
    this.trackRotation(direction);

    // Limpiar estado después de animación (tiempo sincronizado con CSS)
    setTimeout(() => {
      this.isRotating = false;
      this.cards.forEach((card) =>
        card.classList.remove("rotating-service-card--rotating")
      );
    }, 800); // Sincronizado con la transición CSS de 0.8s
  }

  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      const isActive = index === this.centerIndex;
      indicator.classList.toggle(
        "rotating-carousel__indicator--active",
        isActive
      );
      indicator.setAttribute("aria-pressed", isActive.toString());
    });
  }

  announceCurrentService() {
    const currentService = this.serviceNames[this.centerIndex];
    const announcement = `Servicio actual: ${currentService}`;

    const announcer = Utils.createElement(
      "div",
      {
        "aria-live": "polite",
        "aria-atomic": "true",
        className: "sr-only",
      },
      announcement
    );

    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 1000);
  }

  startAutoplay() {
    if (!this.isAutoPlaying) return;

    this.autoplayInterval = setInterval(() => {
      if (!this.isRotating) {
        this.rotateRight();
      }
    }, this.autoplayDelay);

    Utils.log("info", "Carousel autoplay started");
  }

  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  resumeAutoplay() {
    if (this.isAutoPlaying && !this.autoplayInterval) {
      this.startAutoplay();
    }
  }

  toggleAutoplay() {
    this.isAutoPlaying = !this.isAutoPlaying;

    if (this.autoplayBtn) {
      if (this.isAutoPlaying) {
        this.startAutoplay();
        this.autoplayBtn.textContent = "⏸️ Pausar Auto-play";
        this.autoplayBtn.setAttribute(
          "aria-label",
          "Pausar reproducción automática"
        );
      } else {
        this.pauseAutoplay();
        this.autoplayBtn.textContent = "▶️ Iniciar Auto-play";
        this.autoplayBtn.setAttribute(
          "aria-label",
          "Iniciar reproducción automática"
        );
      }
    }

    Utils.log(
      "info",
      `Carousel autoplay: ${this.isAutoPlaying ? "enabled" : "disabled"}`
    );
  }

  trackRotation(direction) {
    const currentService = this.serviceTypes[this.centerIndex];

    if (window.analytics) {
      window.analytics.trackEvent("rotating_carousel_navigation", {
        direction: direction,
        center_service: currentService,
        center_index: this.centerIndex,
        service_name: this.serviceNames[this.centerIndex],
        method: "rotation",
        total_services: this.totalServices,
      });
    }

    Utils.log("info", `Tracked rotation: ${direction} to ${currentService}`);
  }

  destroy() {
    this.pauseAutoplay();
    Utils.log("info", "Rotating Services Carousel destroyed");
  }

  getCurrentService() {
    return {
      index: this.centerIndex,
      name: this.serviceNames[this.centerIndex],
      type: this.serviceTypes[this.centerIndex],
    };
  }

  goToService(index) {
    if (index >= 0 && index < this.totalServices) {
      this.focusService(index);
    }
  }

  isPlaying() {
    return this.isAutoPlaying;
  }
}

/* ===== CONTROLADOR DE HEADER Y NAVEGACIÓN ===== */
class HeaderController {
  constructor() {
    this.header = document.getElementById("header");
    this.mobileMenuBtn = document.getElementById("mobile-menu-btn");
    this.navMenu = document.getElementById("nav-menu");
    this.mobileMenuOpen = false;
    this.scrollThreshold = 100;

    this.init();
  }

  init() {
    if (!this.header) {
      Utils.log("warn", "Header element not found");
      return;
    }

    this.setupScrollEffect();
    this.setupSmoothScrolling();
    this.setupMobileMenu();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();

    Utils.log("info", "Header controller initialized");
  }

  setupScrollEffect() {
    const handleScroll = Utils.throttle(() => {
      const scrolled = window.pageYOffset > this.scrollThreshold;
      this.header.classList.toggle("scrolled", scrolled);
    }, 16); // ~60fps

    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  setupSmoothScrolling() {
    // Solo para enlaces internos de navegación
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        this.smoothScrollTo(anchor.getAttribute("href"));
      });
    });
  }

  smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (!element) return;

    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    // Anunciar navegación para screen readers
    this.announceNavigation(element);

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    // Manejar focus para accesibilidad
    setTimeout(() => {
      element.setAttribute("tabindex", "-1");
      element.focus();
      element.addEventListener(
        "blur",
        () => {
          element.removeAttribute("tabindex");
        },
        { once: true }
      );
    }, 500);
  }

  setupMobileMenu() {
    if (!this.mobileMenuBtn || !this.navMenu) return;

    this.mobileMenuBtn.addEventListener("click", () => {
      this.toggleMobileMenu();
    });

    // Cerrar menú con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (
        this.mobileMenuOpen &&
        !this.navMenu.contains(e.target) &&
        !this.mobileMenuBtn.contains(e.target)
      ) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
  }

  openMobileMenu() {
    this.mobileMenuOpen = true;
    this.mobileMenuBtn.setAttribute("aria-expanded", "true");
    this.navMenu.classList.add("nav-menu--open");

    // Focus en el primer enlace del menú
    const firstLink = this.navMenu.querySelector("a");
    if (firstLink) firstLink.focus();

    Utils.log("info", "Mobile menu opened");
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");
    this.navMenu.classList.remove("nav-menu--open");

    // Devolver focus al botón
    this.mobileMenuBtn.focus();

    Utils.log("info", "Mobile menu closed");
  }

  setupKeyboardNavigation() {
    // Navegación con flechas en el menú
    this.navMenu.addEventListener("keydown", (e) => {
      const focusableElements = this.navMenu.querySelectorAll("a, button");
      const currentIndex = Array.from(focusableElements).indexOf(
        document.activeElement
      );

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex].focus();
          break;

        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          const prevIndex =
            currentIndex === 0
              ? focusableElements.length - 1
              : currentIndex - 1;
          focusableElements[prevIndex].focus();
          break;

        case "Home":
          e.preventDefault();
          focusableElements[0].focus();
          break;

        case "End":
          e.preventDefault();
          focusableElements[focusableElements.length - 1].focus();
          break;
      }
    });
  }

  setupFocusManagement() {
    // Gestión de focus visible para mejor UX
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation");
      }
    });

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-navigation");
    });
  }

  announceNavigation(element) {
    // Crear anuncio para screen readers
    const announcement = Utils.createElement(
      "div",
      {
        "aria-live": "polite",
        "aria-atomic": "true",
        className: "sr-only",
      },
      `Navegando a ${
        element.querySelector("h1, h2, h3")?.textContent || "sección"
      }`
    );

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
}

/* ===== CONTROLADOR DE FORMULARIO DE CONTACTO ===== */
class ContactFormController {
  constructor() {
    this.form = document.getElementById("contact-form");
    this.submitBtn = null;
    this.messageContainer = null;
    this.lastSubmitTime = 0;
    this.validationRules = {
      name: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, type: "email", maxLength: 254 },
      company: { required: true, minLength: 2, maxLength: 200 },
      message: { required: false, maxLength: 2000 },
    };

    this.init();
  }

  init() {
    if (!this.form) {
      Utils.log("warn", "Contact form not found");
      return;
    }

    this.submitBtn = this.form.querySelector(".contact-form__submit");
    this.messageContainer = this.form.querySelector(".contact-form__message");

    this.setupFormSubmission();
    this.setupRealTimeValidation();
    this.setupAccessibilityFeatures();

    Utils.log("info", "Contact form controller initialized");
  }

  setupFormSubmission() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  setupRealTimeValidation() {
    Object.keys(this.validationRules).forEach((fieldName) => {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field) return;

      // Validación en blur para mejor UX
      field.addEventListener("blur", () => {
        this.validateField(fieldName, field.value);
      });

      // Validación en input para email y campos requeridos
      if (fieldName === "email" || this.validationRules[fieldName].required) {
        field.addEventListener(
          "input",
          Utils.debounce(() => {
            this.validateField(fieldName, field.value);
          }, 300)
        );
      }
    });
  }

  setupAccessibilityFeatures() {
    // Mejorar experiencia con screen readers
    this.form.addEventListener("focusin", (e) => {
      const field = e.target;
      if (field.matches("input, textarea")) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        if (label) {
          field.setAttribute("aria-describedby", `${field.id}-desc`);
        }
      }
    });
  }

  validateField(fieldName, value) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    const rules = this.validationRules[fieldName];
    const errorContainer = this.form.querySelector(`#${fieldName}-error`);

    if (!field || !rules) return true;

    // Limpiar errores previos
    this.clearFieldError(field, errorContainer);

    const sanitizedValue = Utils.sanitizeInput(value, {
      maxLength: rules.maxLength,
      trimWhitespace: true,
    });

    // Validar campo requerido
    if (rules.required && !sanitizedValue) {
      this.showFieldError(
        field,
        errorContainer,
        CONFIG.MESSAGES.VALIDATION_REQUIRED
      );
      return false;
    }

    // Validar longitud mínima
    if (rules.minLength && sanitizedValue.length < rules.minLength) {
      const message = CONFIG.MESSAGES.VALIDATION_MIN_LENGTH.replace(
        "{min}",
        rules.minLength
      );
      this.showFieldError(field, errorContainer, message);
      return false;
    }

    // Validar email
    if (
      rules.type === "email" &&
      sanitizedValue &&
      !Utils.isValidEmail(sanitizedValue)
    ) {
      this.showFieldError(
        field,
        errorContainer,
        CONFIG.MESSAGES.VALIDATION_EMAIL
      );
      return false;
    }

    return true;
  }

  showFieldError(field, errorContainer, message) {
    field.setAttribute("aria-invalid", "true");
    field.classList.add("form-group__input--error");

    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.setAttribute("role", "alert");
    }
  }

  clearFieldError(field, errorContainer) {
    field.setAttribute("aria-invalid", "false");
    field.classList.remove("form-group__input--error");

    if (errorContainer) {
      errorContainer.textContent = "";
      errorContainer.removeAttribute("role");
    }
  }

  async handleSubmit() {
    try {
      // Rate limiting
      const now = Date.now();
      if (now - this.lastSubmitTime < CONFIG.FORM_SUBMIT_COOLDOWN) {
        this.showMessage(
          "Por favor espera un momento antes de enviar otra solicitud.",
          "error"
        );
        return;
      }

      // Validar todos los campos
      const formData = new FormData(this.form);
      const data = {};
      let isValid = true;

      Object.keys(this.validationRules).forEach((fieldName) => {
        const value = formData.get(fieldName) || "";
        data[fieldName] = Utils.sanitizeInput(value, {
          maxLength: this.validationRules[fieldName].maxLength,
        });

        if (!this.validateField(fieldName, value)) {
          isValid = false;
        }
      });

      if (!isValid) {
        this.focusFirstError();
        return;
      }

      this.setSubmitState("loading");
      this.lastSubmitTime = now;

      // Enviar datos
      const result = await this.submitFormData(data);

      if (result.success) {
        this.setSubmitState("success");
        this.showMessage(CONFIG.MESSAGES.FORM_SUCCESS, "success");
        this.form.reset();
        this.trackFormSubmission(data, "success");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      Utils.log("error", "Form submission error:", error);
      this.setSubmitState("error");
      this.showMessage(CONFIG.MESSAGES.FORM_ERROR, "error");
      this.trackFormSubmission({}, "error");
    }
  }

  async submitFormData(data) {
    // Timeout para evitar colgados
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), CONFIG.FORM_TIMEOUT);
    });

    try {
      // Netlify Forms (opción por defecto)
      if (this.form.hasAttribute("netlify")) {
        const fetchPromise = fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: this.encodeFormData({
            "form-name": "contact",
            ...data,
          }),
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return { success: true };
      }

      // Simulación para desarrollo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Utils.log("info", "Form data (simulated):", data);
      return { success: true };
    } catch (error) {
      if (error.message === "Timeout") {
        throw new Error(CONFIG.MESSAGES.FORM_TIMEOUT);
      }
      throw error;
    }
  }

  encodeFormData(data) {
    return Object.keys(data)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
      )
      .join("&");
  }

  setSubmitState(state) {
    if (!this.submitBtn) return;

    const states = {
      default: { text: "Enviar Solicitud", disabled: false, loading: false },
      loading: { text: "Enviando...", disabled: true, loading: true },
      success: { text: "Enviado ✓", disabled: false, loading: false },
      error: { text: "Enviar Solicitud", disabled: false, loading: false },
    };

    const currentState = states[state];

    this.submitBtn.disabled = currentState.disabled;
    this.submitBtn.classList.toggle(
      "contact-form__submit--loading",
      currentState.loading
    );

    const textElement = this.submitBtn.querySelector(
      ".contact-form__submit-text"
    );
    if (textElement) {
      textElement.textContent = currentState.text;
    }

    // Reset estado después de 3 segundos si es success o error
    if (state === "success" || state === "error") {
      setTimeout(() => {
        this.setSubmitState("default");
      }, 3000);
    }
  }

  showMessage(message, type) {
    if (!this.messageContainer) return;

    this.messageContainer.textContent = message;
    this.messageContainer.className = `contact-form__message contact-form__message--${type}`;

    // Anunciar mensaje para screen readers
    this.messageContainer.setAttribute("aria-live", "polite");

    // Auto-hide después de 8 segundos
    setTimeout(() => {
      this.messageContainer.textContent = "";
      this.messageContainer.className = "contact-form__message";
    }, 8000);
  }

  focusFirstError() {
    const firstError = this.form.querySelector('[aria-invalid="true"]');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  trackFormSubmission(data, status) {
    if (window.analytics) {
      window.analytics.trackEvent("form_submission", {
        form_type: "contact",
        status: status,
        company: data.company || "unknown",
        has_message: !!(data.message && data.message.length > 0),
      });
    }
  }
}

/* ===== CONTROLADOR DE ANIMACIONES ===== */
class AnimationController {
  constructor() {
    this.animatedElements = new Set();
    this.observer = null;

    // Respetar preferencias de movimiento
    if (Utils.prefersReducedMotion()) {
      CONFIG.ANIMATION_ENABLED = false;
      Utils.log("info", "Animations disabled due to user preference");
    }

    this.init();
  }

  init() {
    if (!CONFIG.ANIMATION_ENABLED) return;

    this.setupIntersectionObserver();
    this.observeElements();

    Utils.log("info", "Animation controller initialized");
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
  }

  observeElements() {
    const elementsToAnimate = document.querySelectorAll(
      ".service-card, .why-card, .contact-card, .hero__content, .rotating-service-card"
    );

    elementsToAnimate.forEach((element) => {
      this.observer.observe(element);
    });
  }

  animateElement(element) {
    // Agregar clase de animación respetando las preferencias
    element.classList.add("fade-in-up");

    // Anunciar animación para usuarios con screen readers si es necesario
    if (element.hasAttribute("aria-label")) {
      const announcement = Utils.createElement(
        "div",
        {
          "aria-live": "polite",
          className: "sr-only",
        },
        "Contenido cargado"
      );

      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.animatedElements.clear();
  }
}

/* ===== CONTROLADOR DE ANALYTICS ===== */
class AnalyticsController {
  constructor() {
    this.trackingEnabled = false;
    this.eventQueue = [];

    this.init();
  }

  init() {
    // Verificar si Google Analytics está disponible
    if (typeof gtag !== "undefined" && CONFIG.ANALYTICS_ID !== "G-XXXXXXXXXX") {
      this.trackingEnabled = true;
      this.processEventQueue();
    }

    this.setupEventTracking();
    this.trackPageView();

    Utils.log(
      "info",
      `Analytics controller initialized (tracking: ${this.trackingEnabled})`
    );
  }

  trackEvent(eventName, parameters = {}) {
    const eventData = {
      event_name: eventName,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      ...parameters,
    };

    if (this.trackingEnabled && typeof gtag !== "undefined") {
      gtag("event", eventName, parameters);
      Utils.log("info", `Analytics event: ${eventName}`, parameters);
    } else {
      // Encolar evento para cuando Analytics esté disponible
      this.eventQueue.push(eventData);
      Utils.log("info", `Analytics event queued: ${eventName}`, parameters);
    }
  }

  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      this.trackEvent(event.event_name, event);
    }
  }

  setupEventTracking() {
    // Trackear clics en CTAs
    document
      .querySelectorAll(".btn--primary, .btn--secondary")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          this.trackEvent("cta_click", {
            button_text: btn.textContent.trim(),
            button_type: btn.classList.contains("btn--primary")
              ? "primary"
              : "secondary",
            section: this.getElementSection(btn),
            url: btn.getAttribute("href") || "no-url",
          });
        });
      });

    // Trackear navegación interna
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        this.trackEvent("nav_click", {
          link_text: link.textContent.trim(),
          target_section: link.getAttribute("href"),
        });
      });
    });

    // Trackear profundidad de scroll
    this.setupScrollTracking();

    // Trackear tiempo en página
    this.setupTimeTracking();
  }

  setupScrollTracking() {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 90, 100];
    const trackedMilestones = new Set();

    const handleScroll = Utils.throttle(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        // Trackear milestones
        milestones.forEach((milestone) => {
          if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
            trackedMilestones.add(milestone);
            this.trackEvent("scroll_depth", {
              percent: milestone,
              max_scroll: maxScroll,
            });
          }
        });
      }
    }, 250);

    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  setupTimeTracking() {
    const startTime = Date.now();
    const intervals = [30, 60, 120, 300]; // segundos
    const trackedIntervals = new Set();

    const trackTimeOnPage = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);

      intervals.forEach((interval) => {
        if (timeOnPage >= interval && !trackedIntervals.has(interval)) {
          trackedIntervals.add(interval);
          this.trackEvent("time_on_page", {
            seconds: interval,
            total_time: timeOnPage,
          });
        }
      });
    };

    // Trackear cada 30 segundos
    setInterval(trackTimeOnPage, 30000);

    // Trackear al salir de la página
    window.addEventListener("beforeunload", () => {
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      this.trackEvent("page_exit", {
        total_time: totalTime,
        max_scroll: maxScroll,
      });
    });
  }

  trackPageView() {
    this.trackEvent("page_view", {
      page: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
    });
  }

  getElementSection(element) {
    const section = element.closest("section");
    return section ? section.id || section.className : "unknown";
  }
}

/* ===== CONTROLADOR DE UTILIDADES ===== */
class UtilityController {
  constructor() {
    this.init();
  }

  init() {
    this.setupScheduleCallButton();
    this.setupLazyLoading();
    this.setupPerformanceMonitoring();
    this.setupExternalLinks();

    Utils.log("info", "Utility controller initialized");
  }

  setupScheduleCallButton() {
    const scheduleBtn = document.getElementById("schedule-call");
    if (!scheduleBtn) return;

    scheduleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.openCalendlyScheduler();
    });
  }

  openCalendlyScheduler() {
    // TODO: Integrar Calendly cuando esté configurado
    if (
      typeof Calendly !== "undefined" &&
      CONFIG.CALENDLY_URL !== "https://calendly.com/d38-security-labs"
    ) {
      Calendly.initPopupWidget({
        url: CONFIG.CALENDLY_URL,
        text: "Agendar Consulta",
        color: "#0995e1",
        textColor: "#ffffff",
        branding: true,
      });

      Utils.log("info", "Calendly popup opened");
    } else {
      // Fallback temporal
      alert(CONFIG.MESSAGES.CALENDLY_PENDING);

      // Trackear intento de agendamiento
      if (window.analytics) {
        window.analytics.trackEvent("schedule_attempt", {
          method: "calendly_button",
          status: "fallback",
        });
      }
    }
  }

  setupLazyLoading() {
    // Para imágenes futuras con data-src
    const lazyImages = document.querySelectorAll("img[data-src]");

    if (lazyImages.length === 0) return;

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove("lazy");
            img.classList.add("lazy-loaded");
            imageObserver.unobserve(img);

            Utils.log("info", "Lazy loaded image:", img.src);
          }
        });
      },
      {
        rootMargin: "50px",
      }
    );

    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
  }

  setupPerformanceMonitoring() {
    // Core Web Vitals básico
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          if (navigation) {
            const metrics = {
              load_time: Math.round(
                navigation.loadEventEnd - navigation.loadEventStart
              ),
              dom_content_loaded: Math.round(
                navigation.domContentLoadedEventEnd -
                  navigation.domContentLoadedEventStart
              ),
              first_byte: Math.round(
                navigation.responseStart - navigation.requestStart
              ),
            };

            Utils.log("info", "Performance metrics:", metrics);

            if (window.analytics) {
              window.analytics.trackEvent("performance", metrics);
            }
          }
        }, 0);
      });
    }

    // Detectar problemas de CLS
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;

            Utils.log("warn", "Layout shift detected:", {
              value: entry.value,
              sources: entry.sources?.map((s) => s.node),
            });
          }
        });

        observer.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        Utils.log("warn", "CLS monitoring not supported");
      }
    }
  }

  setupExternalLinks() {
    // Agregar atributos de seguridad a enlaces externos
    document.querySelectorAll('a[href^="http"]').forEach((link) => {
      if (!link.href.includes(window.location.hostname)) {
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("target", "_blank");

        // Agregar indicador visual para screen readers
        if (!link.querySelector(".sr-only")) {
          const indicator = Utils.createElement(
            "span",
            {
              className: "sr-only",
            },
            " (abre en nueva ventana)"
          );
          link.appendChild(indicator);
        }
      }
    });
  }
}

/* ===== CONTROLADOR DE PENTRAX (FUTURO) ===== */
class PentraXController {
  constructor() {
    this.isActive = false;
    this.button = null;

    // No inicializar automáticamente
    Utils.log("info", "PentraX controller ready (inactive)");
  }

  activate(customUrl = null) {
    if (this.isActive) {
      Utils.log("warn", "PentraX already activated");
      return;
    }

    const pentraXUrl = customUrl || CONFIG.PENTRAX_URL;

    this.showPentraXButton();
    this.setupPentraXButton(pentraXUrl);
    this.isActive = true;

    Utils.log("info", "PentraX activated:", pentraXUrl);

    // Trackear activación
    if (window.analytics) {
      window.analytics.trackEvent("pentrax_activated", {
        url: pentraXUrl,
        timestamp: new Date().toISOString(),
      });
    }
  }

  showPentraXButton() {
    const navItem = document.querySelector(".pentrax-nav-item");
    if (navItem) {
      navItem.style.display = "block";
      this.button = navItem.querySelector(".pentrax-btn");
    }
  }

  setupPentraXButton(url) {
    if (!this.button) return;

    this.button.addEventListener("click", (e) => {
      e.preventDefault();
      this.redirectToPentraX(url);
    });

    // Actualizar href
    this.button.setAttribute("href", url);
  }

  redirectToPentraX(url) {
    // Trackear acceso antes de redirección
    if (window.analytics) {
      window.analytics.trackEvent("pentrax_access", {
        source: "landing_page",
        url: url,
        timestamp: new Date().toISOString(),
      });
    }

    // Mostrar mensaje de carga
    const originalText = this.button.textContent;
    this.button.textContent = "Redirigiendo...";

    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      this.button.textContent = originalText;
    }, 500);

    Utils.log("info", "Redirecting to PentraX:", url);
  }
}

/* ===== APLICACIÓN PRINCIPAL ===== */
class D38LandingPage {
  constructor() {
    this.controllers = {};
    this.initialized = false;

    this.init();
  }

  init() {
    // Verificar estado de DOM
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initializeApp());
    } else {
      this.initializeApp();
    }
  }

  initializeApp() {
    try {
      Utils.log("info", "Initializing D38 Landing Page...");

      // Inicializar controladores principales
      this.controllers.header = new HeaderController();
      this.controllers.contactForm = new ContactFormController();
      this.controllers.animations = new AnimationController();
      this.controllers.analytics = new AnalyticsController();
      this.controllers.utilities = new UtilityController();

      // Inicializar carrusel rotativo
      const rotatingCarousel = document.getElementById("rotating-carousel");
      if (rotatingCarousel) {
        this.controllers.rotatingCarousel = new RotatingServicesCarousel(
          rotatingCarousel
        );
        Utils.log("info", "Rotating carousel controller added");
      } else {
        Utils.log("warn", "Rotating carousel element not found in DOM");
      }

      // Controlador PentraX (inactivo por defecto)
      this.controllers.pentrax = new PentraXController();

      // Configurar alias global para analytics
      this.setupGlobalAnalytics();

      // Configurar manejo de errores global
      this.setupErrorHandling();

      this.initialized = true;

      Utils.log("info", "D38 Landing Page initialized successfully");

      // Exponer API para debugging en desarrollo
      if (CONFIG.DEBUG_MODE) {
        window.D38 = this;
        window.D38Utils = Utils;
        Utils.log("info", "Debug mode: D38 and D38Utils available globally");
      }
    } catch (error) {
      Utils.log("error", "Failed to initialize landing page:", error);
      this.handleInitializationError(error);
    }
  }

  setupGlobalAnalytics() {
    // Crear alias global para compatibilidad
    window.analytics = {
      trackEvent: (eventName, properties) => {
        if (this.controllers.analytics) {
          this.controllers.analytics.trackEvent(eventName, properties);
        }
      },
    };
  }

  setupErrorHandling() {
    // Capturar errores no manejados
    window.addEventListener("error", (event) => {
      Utils.log("error", "Unhandled error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Capturar promesas rechazadas
    window.addEventListener("unhandledrejection", (event) => {
      Utils.log("error", "Unhandled promise rejection:", event.reason);
    });
  }

  handleInitializationError(error) {
    // Fallback graceful en caso de error crítico
    console.error("D38 Landing Page initialization failed:", error);

    // Asegurar que el formulario básico funcione
    const form = document.getElementById("contact-form");
    if (form && !form.hasAttribute("data-fallback-initialized")) {
      form.setAttribute("data-fallback-initialized", "true");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Por favor contacta directamente a contact@d38labs.com");
      });
    }
  }

  // API pública para activar PentraX
  activatePentraX(customUrl) {
    if (this.controllers.pentrax) {
      this.controllers.pentrax.activate(customUrl);
      return true;
    }
    return false;
  }

  // API pública para configuración dinámica
  updateConfig(newConfig) {
    Object.assign(CONFIG, newConfig);
    Utils.log("info", "Configuration updated:", newConfig);
  }

  // API pública para obtener métricas
  getMetrics() {
    return {
      initialized: this.initialized,
      controllers: Object.keys(this.controllers),
      config: CONFIG,
      performance: performance.getEntriesByType("navigation")[0],
    };
  }

  // Destructor para cleanup
  destroy() {
    Object.values(this.controllers).forEach((controller) => {
      if (controller && typeof controller.destroy === "function") {
        controller.destroy();
      }
    });

    this.controllers = {};
    this.initialized = false;

    if (window.D38) {
      delete window.D38;
    }

    Utils.log("info", "D38 Landing Page destroyed");
  }
}

/* ===== INICIALIZACIÓN ===== */
const d38LandingPage = new D38LandingPage();

/* ===== INSTRUCCIONES PARA IMPLEMENTACIÓN ===== */
/**
 * GUÍA DE ACTIVACIÓN E INTEGRACIÓN:
 *
 * 1. ACTIVAR PENTRAX:
 *    d38LandingPage.activatePentraX('https://pentrax.d38labs.com');
 *
 * 2. CONFIGURAR ANALYTICS:
 *    - Cambiar CONFIG.ANALYTICS_ID por tu ID real de GA4
 *    - Descomentar script de Google Analytics en HTML
 *    - Las funciones de tracking ya están preparadas
 *
 * 3. CONFIGURAR FORMULARIO:
 *    - Para Netlify Forms: Ya configurado, solo subir a Netlify
 *    - Para API personalizada: Cambiar CONFIG.API_ENDPOINT y descomentar código
 *
 * 4. CONFIGURAR CALENDLY:
 *    - Cambiar CONFIG.CALENDLY_URL por tu URL real
 *    - Agregar script de Calendly al HTML
 *    - La integración ya está preparada
 *
 * 5. MONITOREO DE PERFORMANCE:
 *    - Core Web Vitals automático
 *    - Métricas disponibles en: d38LandingPage.getMetrics()
 *
 * 6. DEBUGGING:
 *    - Cambiar CONFIG.DEBUG_MODE = true para desarrollo
 *    - Acceder a D38 y D38Utils globalmente para testing
 */

Utils.log("info", "🚀 D38 Security Labs - Optimized Landing Page v2.0.1 loaded");
Utils.log("info", "📊 Debug mode:", CONFIG.DEBUG_MODE);
Utils.log("info", "🎨 Animations enabled:", CONFIG.ANIMATION_ENABLED);
Utils.log(
  "info",
  "📱 Ready for PentraX activation: d38LandingPage.activatePentraX()"
);
Utils.log("info", "🎠 Carousel with corrected positioning values loaded");

/* ===== EXPORT FOR MODULE SYSTEMS (FUTURE) ===== */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { D38LandingPage, Utils };
}