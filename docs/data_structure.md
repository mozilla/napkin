# Data Structure - version 0.1

## Key Format

### Projects (Sitemaps)

    String 

    project:test@test.org:<project_id>

    Properties

    title, author, created (default = current time)

### Screens

    String

    project:<project_id>:screen:<screen_id>

    Properties

    name, is_start (default = false), layout

### Components

    String

    project:<project_id>:screen:<screen_id>:component:<component_id>

    Properties

    type, layout, action (optional)

### Elements

    String

    project:<project_id>:component:<component_id>:element:<element_id>

    Properties

    type, name, identifier, required, src (optional)
