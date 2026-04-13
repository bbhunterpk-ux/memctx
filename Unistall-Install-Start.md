Run these commands:                                                                                                                                                
                                                                                                                                                                     
  npm uninstall -g memctx && npm install -g memctx@1.0.11 && memctx restart                                                                                           
                                                                                                                                                                     
  This will:                                                                                                                                                         
  1. Uninstall the old version                                                                                                                                       
  2. Install the new 1.0.8 version                                                                                                                                   
  3. Restart the worker with the fixed code                                                                                                                          
                                                                                                                                                                     
  After that, verify it's working:                                                                                                                                   
  curl http://localhost:9999/api/health                                                                                                                              
  tail -20 /tmp/memctx.log                                                                                                                                           
                                    