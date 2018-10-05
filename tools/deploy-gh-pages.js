#!/usr/bin/env node

var ghpages = require('gh-pages');

ghpages.publish('.', {
          src: [
            'README.md',
            'dist/**/*',
            'docs/**/*',
            'test/decorate-html.test.html',
            'test/decorate-react.test.html',
            'test/decorate-text.test.css'
          ]
        }, (err) => {
  console.log(!err ? `Success!` : `Error: ${err}`);

  console.log(`Site deployed to: https://concord-consortium.github.io/text-decorator/`);
});
