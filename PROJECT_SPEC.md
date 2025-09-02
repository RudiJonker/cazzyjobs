PROJECT: cazzyjobs - Detailed Project Map
Core Concept: A recruitment app for localized casual labour (e.g., gardening, cleaning, domestic work). Targets less educated, poorer communities. Employers can be homeowners, small businesses, etc.

1. Tech Stack & Environment
Framework: Expo SDK 53 (Managed Workflow)

Frontend: React Native 0.79.6, React 19.0.0

Navigation: React Navigation v7 (@react-navigation/native, bottom-tabs, stack)

Backend: Supabase (Auth, Database, Realtime)

State/Local Storage: React Native AsyncStorage

Environment Variables: react-native-dotenv

Icons: @expo/vector-icons

Repo: https://github.com/RudiJonker/cazzyjobs (Private)

2. Database Schema (Supabase)
Tables:

profiles (Extends auth.users)

id (UUID, references auth.users)

user_role (Text, 'worker' or 'employer')

full_name (Text)

city (Text) // Primary location filter

avatar_url (Text)

bio (Text)

jobs

id (UUID)

employer_id (UUID, references profiles)

title (Text)

description (Text)

category (Text)

job_city (Text) // Must match user's city for filtering

full_address (Text) // Only shared privately via chat after hire

proposed_wage (Numeric)

status (Text, e.g., 'active', 'completed')

applications

id (UUID)

job_id (UUID, references jobs)

worker_id (UUID, references profiles)

status (Text, 'pending', 'hired', 'rejected')

hired_at (Timestamptz) // Timestamp when chat is enabled

messages

id (UUID)

application_id (UUID, references applications) // Chat is scoped to a hire

sender_id (UUID, references profiles)

content (Text)

read (Boolean)

3. Screen Flow & User Journey
A. Authentication Stack

WelcomeScreen: App logo, tagline, "Get Started" button.

SignUpScreen: Email, Password, Role selection (worker/employer), "Log In" link.

LoginScreen: Email, Password, "Sign Up" link.

ForgotPasswordScreen: (To be built later).

B. Main App (Tab Navigator)

HomeTab (Stack)

HomeScreen: List of active jobs in the user's city.

JobDetailScreen: Full job details. "I'm Interested!" button.

EmployerProfileScreen: Public profile view of a job poster.

SearchTab

SearchScreen: Search bar + grid of category buttons (e.g., Cleaning, Gardening).

PostJobTab (Stack)

PostJobScreen: Multi-step form (What, Where, When, How Much).

PreviewJobScreen: Confirmation screen before posting.

JobPostedScreen: Success screen.

MessagesTab (Stack)

MessagesListScreen: List of conversations (only for hired applications).

ChatScreen: Message interface. Address sharing happens here.

ProfileTab (Stack)

ProfileScreen: User's own profile. Displays "My Applications" (worker) and "My Job Posts" (employer).

EditProfileScreen: Edit name, bio, city, etc.

JobManagementScreen (For employers): View applicants for a job and Hire them (this enables chat).

4. Key Features & Logic
Privacy: Chat and exact address (full_address) are only accessible after an employer explicitly hires a worker (updates applications.status to 'hired').

Location: User's city is set once during profile setup/onboarding. Used as the default filter on the HomeScreen.

Navigation: Role-based UI changes within the same tabs (e.g., "Post Job" tab disabled for workers).

Monetization: Static ad banner planned for the JobDetailScreen (for later implementation).

5. Progress Tracking (Last Updated: 2025-09-02)
✅ COMPLETED

Project initialized with Expo SDK 53.

Core dependencies installed and stabilized.

GitHub repository linked and initial commit pushed.

PROJECT_SPEC.md created.