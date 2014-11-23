<?php namespace Helpers;

  require '../v1/database.php';
  require '../v1/configure.php';

  DB::load(__DIR__."/deploy.json");
  Configuration::load(__DIR__."/deploy.json");

  $dir_name = "fixtures";
  $mysql_link = DB::connect();

  // read each file from the fixtures directory
  $files = glob("$dir_name/*.json", GLOB_BRACE);
  foreach($files as $file) {
    // get the name of the table from the file
    $table_name = preg_match("/fixtures\/(.*)\.json/", $file, $matches);
    $table_name = $matches[1];

    // drop everything from the table
    $mysql_link->query("
      DELETE FROM $table_name
    ");

    $handle = fopen($file, "r");
    // decode the json
    $contents = fread($handle, filesize($file));
    $contents = json_decode($contents); 
    // loop over the entries
    foreach($contents as $entry){
      $fields = [];
      $values = [];
      foreach($entry as $key=>$val){
        $val = $mysql_link->real_escape_string($val);
        $fields[] = $key;
        $values[] = "'$val'";
      }

      // insert each into the file's database table 
      $fields = join($fields, ", ");
      $values = join($values, ", ");
      $mysql_link->query("
        INSERT INTO 
        $table_name(
          $fields
        )VALUES(
          $values
        )
      ");
    }
  }  
  
  
  
