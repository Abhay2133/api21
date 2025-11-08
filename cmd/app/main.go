package main

import (
	"flag"
	"log"
	"os"

	"api21/actions"

	"github.com/gobuffalo/buffalo/servers"
	"github.com/gobuffalo/envy"
)

// main is the starting point for your Buffalo application.
// You can feel free and add to this `main` method, change
// what it does, etc...
// All we ask is that, at some point, you make sure to
// call `app.Serve()`, unless you don't want to start your
// application that is. :)
func main() {
	// Parse command-line flags FIRST (before anything else)
	port := flag.String("port", "", "Port to run the server on (overrides PORT env var)")
	flag.Parse()

	// If port flag is provided, set it BEFORE loading .env
	if *port != "" {
		os.Setenv("PORT", *port)
	}

	// Now load .env file - port override will take precedence since it's already set
	_ = envy.Load()

	app := actions.App()

	// Create a custom simple server with the correct port
	portValue := os.Getenv("PORT")
	if *port != "" {
		portValue = *port
	}
	srv := servers.New()
	srv.Addr = ":" + portValue
	err := app.Serve(srv)
	if err != nil {
		log.Fatal(err)
	}
}

/*
# Notes about `main.go`

## SSL Support

We recommend placing your application behind a proxy, such as
Apache or Nginx and letting them do the SSL heavy lifting
for you. https://gobuffalo.io/en/docs/proxy

## Buffalo Build

When `buffalo build` is run to compile your binary, this `main`
function will be at the heart of that binary. It is expected
that your `main` function will start your application using
the `app.Serve()` method.

*/
