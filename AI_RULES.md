# AI Development Rules and Guidelines

This document outlines the core technologies and best practices for developing this application. Adhering to these rules ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

*   **React:** The primary JavaScript library for building user interfaces.
*   **TypeScript:** Used for type safety, improving code quality and developer experience.
*   **React Router:** Handles client-side routing, with all main routes defined in `src/App.tsx`.
*   **Tailwind CSS:** A utility-first CSS framework used exclusively for all styling.
*   **shadcn/ui:** A collection of re-usable components built with Radix UI and Tailwind CSS.
*   **Radix UI:** Provides unstyled, accessible components that `shadcn/ui` builds upon.
*   **lucide-react:** A library for beautiful and consistent open-source icons.
*   **Project Structure:** Components reside in `src/components/`, pages in `src/pages/`, and the main application entry point is `src/pages/Index.tsx`.
*   **File Naming:** Directory names are lowercase (e.g., `src/pages`), while file names may use mixed-case (e.g., `UserProfile.tsx`).

## Library Usage Rules

*   **UI Components:**
    *   **Prioritize shadcn/ui:** Always use components from `shadcn/ui` whenever a suitable component exists for the required functionality.
    *   **No Direct Modification:** Do NOT modify `shadcn/ui` component files directly. If a `shadcn/ui` component needs customization beyond its props, create a new wrapper component in `src/components/` that composes or extends the `shadcn/ui` component.
    *   **Custom Components:** For UI elements not covered by `shadcn/ui`, create new, small, and focused components in `src/components/`.
*   **Styling:**
    *   **Tailwind CSS Only:** All styling must be done using Tailwind CSS utility classes. Avoid inline styles, separate CSS files, or other styling methods.
    *   **Responsive Design:** Always ensure designs are responsive using Tailwind's responsive utility classes.
*   **Icons:**
    *   **lucide-react:** Use `lucide-react` for all icon needs.
*   **Routing:**
    *   **React Router:** Use `react-router-dom` for all navigation and routing within the application.
    *   **Route Definition:** Define all primary application routes within `src/App.tsx`.
*   **File Organization:**
    *   **New Components:** Every new component, no matter how small, must be created in its own file within `src/components/`.
    *   **New Pages:** Every new page must be created in its own file within `src/pages/`.
    *   **Utilities:** Helper functions and non-component logic should be placed in `src/utils/`.
*   **State Management:**
    *   **React Hooks:** Prefer React's built-in state management (e.g., `useState`, `useContext`) for local and shared state, unless a more advanced solution is explicitly requested and justified.