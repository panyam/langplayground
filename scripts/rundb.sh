#!/bin/bash

# Kill any previous instances
kill -9 `lsof -nP -iTCP:7071 | grep LISTEN | sed -e "s/  */ /g" | cut -f 2 -d ' '`

if [ "$1" = "reset" ]; then 
  rm -f ~/.config/gcloud/emulators/datastore/WEB-INF/appengine-generated/local_db.bin
fi

gcloud beta emulators datastore start --host-port="localhost:7071" --consistency=1.0 --verbosity=debug
