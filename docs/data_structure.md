# Data Structure - version 0.1

## Key/Value Format

### Projects

    Key: <userEmail>:projects

    Value: Hash of <projectId> => <projectObject> (JSON)

    Properties:
      title - title of this project
      author - who, identified by email, was this created by
      created - what time was this created; defaults to current time

### Screens

    Key: <userEmail>:projects:<projectId>:screens

    Value: Hash of <screenId> => <screenObject> (JSON)

    Properties:
      title - title of this screen
      isStart - whether this screen is the first to be viewed; defaults to false
      layout - what layout this screen is using

### Components

    Key: <userEmail>:projects:<projectId>:screens:<screenId>:components

    Value: Hash of <componentId> => <componentObject> (JSON)

    Properties: type, layout (has integer properties row and col), action (optional; for type = 'form')
      type - the type of this component
      layout - object with integer properties row and column that represent the location of this component in the grid
      action - for forms to identify which screen they should submit to

### Elements

    Key: <userEmail>:projects:<projectId>:screens:<screenId>:components:<componentId>:elements

    Value: Hash of <elementId> => <elementObject> (JSON)

    Properties:
      head - true if this element is the head of the linked list, meaning that it is at the top of its parent component
      nextId - the element that comes after this one in the linked list; along with head, this determines the order of elements
      name - for input fields, determines label and name attribute
      required - for input fields, true if they are required; defaults to false
      text - for heading/paragraph fields, inner text content
      level - for heading fields, the level of the heading; an integer from 1 to 6, representing h1 to h6
