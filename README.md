# API21

A one in all backend to host all my projects running on my older android device using termux and ngrok.

### OVERVIEW

This is `GOLANG` based api only project, made using the `buffalo` framework.

### TDD

Use this cmd to auto-run the tests whenever a source files changes to simulate a TDD env.
```
npx nodemon --ext go,fizz,tmpl --watch actions --watch models --watch migrations --exec "buffalo test"
```