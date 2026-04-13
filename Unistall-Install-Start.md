Run these commands:                                                                                                                                                
                                                                                                                                                                     
  npm uninstall -g memctx && npm install -g memctx@latest && memctx restart                                                                                           
                                                                                                                                                                     
  This will:                                                                                                                                                         
  1. Uninstall the old version                                                                                                                                       
  2. Install the new 1.0.8 version                                                                                                                                   
  3. Restart the worker with the fixed code                                                                                                                          
                                                                                                                                                                     
  After that, verify it's working:                                                                                                                                   
  curl http://localhost:9999/api/health                                                                                                                              
  tail -20 /tmp/memctx.log                                                                                                                                           
                                    cd '/home/max/All_Projects_Files/April 2026 Projects/Claude-Context/artifacts/claudectx-backup' && ps aux | grep "node.*dist/src/index.js" | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null; sleep 1; pnpm run start

                                    To build and start locally on port 3333:                                                                                                                           
                                                          
  # Build                                                                                                                                                            
  cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context/artifacts/claudectx-backup                                                                    
  pnpm run build                                                                                                                                                     
                                                                                                                                                                     
  # Start on port 3333                                                                                                                                               
  PORT=3333 node dist/src/index.js                                                                                                                                   
                                                                                                                                                                     
  Or in one command:                                                                                                                                                 
  cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context/artifacts/claudectx-backup && pnpm run build && PORT=3333 node dist/src/index.js              
                                                                                                                                                                     
  To run in background:                                                                                                                                              
  PORT=3333 node dist/src/index.js > /tmp/memctx-local.log 2>&1 &                                                                                                    
                                                                                                                                                                     
  To stop:                                                                                                                                                           
  ps aux | grep "node.*dist/src/index.js" | grep -v grep | awk '{print $2}' | xargs kill                                                                             
                                                                                                                                                                     
  Current status: Server should already be running on port 3333. Check http://localhost:3333/api/health to verify.                                                   
                                    