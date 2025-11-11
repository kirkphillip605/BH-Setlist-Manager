# BH-Setlist-Manager Documentation

This directory contains comprehensive documentation for the BH-Setlist-Manager application.

## Documentation Files

### 📘 [APPLICATION_SPECIFICATION.md](./APPLICATION_SPECIFICATION.md)
**The complete technical specification document** (~1,600 lines)

This is the primary reference document containing:
- **Database Schema**: All 10 tables with complete specifications
  - Column definitions and data types
  - Foreign key relationships
  - Row Level Security (RLS) policies
  - Indexes and constraints
- **Database Functions**: All 8 PostgreSQL functions
- **Application Features**: Detailed descriptions of all 7 major modules
  1. User Management & Authentication
  2. Song Management
  3. Setlist Management
  4. Song Collections
  5. Performance Mode (Real-time)
  6. Dashboard
  7. Admin Features
- **Service Layer**: Complete API documentation for all 7 services
- **Edge Functions**: All 4 Supabase Edge Functions
- **Data Flow Examples**: Step-by-step workflows
- **Component Architecture**: Frontend structure
- **Security Model**: Authentication and authorization
- **Deployment Guide**: Docker and CapRover setup

**Use this document when you need:**
- Complete technical details
- Database schema for recreation
- API method signatures
- Detailed feature descriptions
- Architecture decisions

---

### 📗 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**A condensed overview and quick reference** (~300 lines)

This document provides:
- High-level concept overview
- Database schema quick view
- Technology stack summary
- Common workflows
- Route listing
- Development setup
- Key relationships diagram

**Use this document when you need:**
- Quick overview of the application
- Technology stack summary
- Common workflow examples
- Development environment setup
- Route reference

---

## For AI Agents

If you're an AI agent tasked with recreating or extending this application:

1. **Start with** `QUICK_REFERENCE.md` to understand the overall architecture
2. **Dive into** `APPLICATION_SPECIFICATION.md` for implementation details
3. **Follow this order**:
   - Set up database schema (migrations)
   - Implement Row Level Security policies
   - Create database functions
   - Build service layer
   - Implement Edge Functions
   - Create UI components
   - Add real-time features
   - Test authentication flows

## For Developers

### Getting Started
1. Read `QUICK_REFERENCE.md` for overview
2. Review database schema in `APPLICATION_SPECIFICATION.md`
3. Understand the service layer architecture
4. Study the Performance Mode for real-time features

### Key Sections by Task

**Setting up the database:**
- See "Database Schema" section in APPLICATION_SPECIFICATION.md
- Review all migration files in `/supabase/migrations`

**Implementing features:**
- See "Application Features" section
- Review corresponding service in "Service Layer" section

**Adding authentication:**
- See "Security Model" and "User Management" sections
- Review AuthContext implementation

**Deploying:**
- See "Build and Deployment" section
- Review Docker configuration

**Working with real-time:**
- See "Performance Mode" feature
- Review performanceService implementation

## Documentation Structure

```
docs/
├── README.md                        # This file - documentation guide
├── APPLICATION_SPECIFICATION.md     # Complete technical specification
└── QUICK_REFERENCE.md              # Quick reference guide
```

## Contributing to Documentation

When updating documentation:

1. **For new features**: Update both files
   - Add detailed specs to APPLICATION_SPECIFICATION.md
   - Add summary to QUICK_REFERENCE.md

2. **For schema changes**: Document in DATABASE SCHEMA section with:
   - Table/column additions
   - New indexes
   - Updated RLS policies

3. **For new services/APIs**: Document:
   - Method signatures
   - Parameters and return types
   - Example usage
   - Error handling

4. **For workflow changes**: Update:
   - Data Flow Examples
   - Common Workflows section

## Document Maintenance

- **Last Updated**: October 2025
- **Version**: 1.0
- **Maintained by**: Development team

---

## Quick Links

### Application Concepts
- [Database Schema](./APPLICATION_SPECIFICATION.md#database-schema)
- [User Roles](./APPLICATION_SPECIFICATION.md#user-management--authentication)
- [Performance Mode](./APPLICATION_SPECIFICATION.md#5-performance-mode)

### Technical Details
- [Service Layer](./APPLICATION_SPECIFICATION.md#service-layer-api-services)
- [Edge Functions](./APPLICATION_SPECIFICATION.md#supabase-edge-functions)
- [Security Model](./APPLICATION_SPECIFICATION.md#security-model)

### Development
- [Setup Guide](./QUICK_REFERENCE.md#development-setup)
- [Technology Stack](./QUICK_REFERENCE.md#technology-stack)
- [Deployment](./APPLICATION_SPECIFICATION.md#build-and-deployment)

---

## Questions?

If you need clarification on any aspect of the application:

1. Check the relevant section in APPLICATION_SPECIFICATION.md
2. Look for related code in the repository
3. Review the migration files for database schema details
4. Examine the service layer for API implementations

The documentation is designed to be comprehensive enough to recreate the entire application from scratch.
