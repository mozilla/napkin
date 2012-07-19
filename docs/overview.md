# Overview - version 0.1

## How It Works

Users create a project for each potential application/site they have in mind. Each project contains multiple screens, which represent pages or different views. After selecting a layout for a screen, users can add components&mdash;articles, forms, navigation, etc.&mdash; and their corresponding elements&mdash;headings, paragraphs, input boxes, links&mdash;as a means of wireframing the pages they would eventually like to create.

But wireframes are not limited to interaction at the inter-screen level. Through links and form submissions, they can also have intra-screen connections. For example, a contact form on one screen could submit to a thank you page represented by another screen. In this way, users are able to create a more complete mockup that not only mimics the final product's aesthetics, but also its interactions.

Once the site is complete, the project can be run as a demo or exported to a standalone node.js express application.

## Technical Code Generation Process

HTML elements include: \<input type="text|radio|checkbox"\>, \<textarea\>, \<select\>, \<audio\>, \<video\>, \<img\>, \<header\>, \<footer\>. All other required elements are auto generated.

HTML elements require a name and optionally a boolean flag of whether it is required or not if an \<input\> or \<textarea\> element is used.

Web components include: a section, a generic form and authentication.

* Screens are created from a project (sitemap).
* HTML elements are embedded into either a section or generic form web component. The authentication component is an independent module that cannot have external dependencies.
* As elements are dragged and dropped, they generate the appropriate JSON data on the server. Proposed format below:

```json
{
    "id": 1,
    "title": "My Project",
    "author": "test@test.org",
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

* Required auto-generates validators for fields if they are empty (specific formatting for email addresses are currently ignored)

After a sitemap is complete, compiling code consists of looping through all the screen objects starting with the one flagged "is_start": true. Only one can be true, the rest are set to false.

Each component generates a pre-written template of code - e.g. forms will generate a form (and include any child input fields) and authentication will generate a Browser ID login link and respective logout link. Pre-written templates may include back-end code alongside client-side views and CSS/JS files.

## Client-side Template Structure

There will be four layouts to choose from that components and elements can be inserted into. Grid sample below:

![Grid samples](http://dl.dropbox.com/u/1913694/napkin_flows/layout.png)

The CSS scaffold will ensure that all screens are responsive and all components and elements resize appropriately.
