# Overview - version 0.1

## What It Is

Napkin is a rapid web prototyping tool meant for users who either are not necessarily developers but are primarily involved in product/UX/UI for a site/application.

## How It Works

A project (sitemap) is created and contains screens which are wireframes containing HTML elements and basic web components.

Once wireframes are completed at the screen level, the screens can be linked at the sitemap level - e.g. a form element is linked to another screen after a successful POSt request is submitted.

Once the site is complete, the project can be compiled and run as a demo or exported as a standalone Node/Express application.

## Technical Code Generation Process

HTML elements include: \<input type="text|radio|checkbox"\>, \<textarea\>, \<select\>, \<audio\>, \<video\>, \<img\>, \<header\>, \<footer\>. All other required elements are auto generated.

HTML elements require a name and optionally a boolean flag of whether it is required or not if an \<input\> or \<textarea\> element is used.

Web components include: a section, a generic form and authentication.

* Screens are created from a project (sitemap).
* HTML elements are embedded into either a section or generic form web component. The authentication component is an independent module that cannot have external dependencies.
* As elements are dragged and dropped, they generate the appropriate JSON data on the server. Proposed format below:

```json
{
    "name": "my_project",
    "screens": [
        {
            "name": "screen1",
            "is_start": true,
            "layout": "col4",
            "components": [
                {
                    "type": "authentication",
                    "layout": "row1"
                },
                {
                    "type": "form",
                    "action": "screen2",
                    "layout": "row2",
                    "elements": [
                        {
                            "type": "text_field",
                            "name": "first_name",
                            "required": true
                        }
                    ]
                },
                {
                    "type": "section",
                    "layout": "row3",
                    "elements": [
                        {
                            "type": "video",
                            "src": "http://test.com/test.ogv"
                        }
                    ]
                }
            ]
        }
    ]
}
```

Notes on JSON attributes:

* Names will have to be unique as multiple references will conflict if a form component points to more than one screen
* Required auto-generates validators for fields if they are empty (specific formatting for email addresses are currently ignored)

After a sitemap is complete, compiling code consists of looping through all the screen objects starting with the one flagged "is_start": true. Only one can be true, the rest are set to false.

Each component generates a pre-written template of code - e.g. forms will generate a form (and include any child input fields) and authentication will generate a Browser ID login link and respective logout link. Pre-written templates may include back-end code alongside client-side views and CSS/JS files.

## Client-side Template Structure

There will be four layouts to choose from that components and elements can be inserted into. Grid sample below:

![Grid samples](http://dl.dropbox.com/u/1913694/napkin_flows/layout.png)

The CSS scaffold will ensure that all screens are responsive and all components and elements resize appropriately.
