test:
	@./node_modules/.bin/mocha

test-projects:
	@./node_modules/.bin/mocha test/test.projects.js

test-screens:
	@./node_modules/.bin/mocha test/test.screens.js

test-components:
	@./node_modules/.bin/mocha test/test.components.js

test-elements:
	@./node_modules/.bin/mocha test/test.elements.js

test-authenticate:
	@./node_modules/.bin/mocha test/test.authenticate.js

.PHONY: test
