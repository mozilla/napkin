test:
	@./node_modules/.bin/mocha --reporter list

test-projects:
	@./node_modules/.bin/mocha --reporter list test/test.projects.js

test-screens:
	@./node_modules/.bin/mocha --reporter list test/test.screens.js

test-components:
	@./node_modules/.bin/mocha --reporter list test/test.components.js

test-elements:
	@./node_modules/.bin/mocha --reporter list test/test.elements.js

test-authenticate:
	@./node_modules/.bin/mocha --reporter list test/test.authenticate.js

.PHONY: test
