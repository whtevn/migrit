<?php namespace Helpers;

  require '../v1/database.php';
  require '../v1/configure.php';

  DB::load(__DIR__."/deploy.json");
  Configuration::load(__DIR__."/deploy.json");

  $mysql_link = DB::connect();

  $result = $mysql_link->query("
    SHOW TABLES
  ");

  while ($table = $result->fetch_object()){
    // get the table name
    $table_name = $table->Tables_in_evan_pinwheel_test;
    // get the table's primary key data
    $i_result = $mysql_link->query("
      SHOW INDEX FROM $table_name
    ");

    // assign the column name to the first key entry
    $column_name = $i_result->fetch_object();
    if(IsSet($column_name->Column_name)){
      $column_name = $column_name->Column_name;
    }
    // if none exists, make the key a hashed concat of all fields

    // start a new fixture file 
    $handle = fopen("fixtures/$table_name.json", "w");
    // open the file with a {
    fwrite($handle, "{\n");
    // select all items from the table
    $f_result = $mysql_link->query("
      SELECT * from $table_name
    ");

    $rows_passed=0;
    // loop over result to write each entry as json
    while($entry = $f_result->fetch_object()){

      if(IsSet($column_name)){
        // if the primary key column name is set
        // store the id of this particular 
        $id  = $entry->$column_name;
      }else{
        // if no such primary key exists, join the values
        $id = join((array)$entry, '');
        // and then hash the values to store that as the id
        $id = sha1($id);
      }

      // ignore null values
      foreach($entry as $key=>$val){
        if($val===NULL){
          unset($entry->$key);
        }
      }

      // build the entry as nice looking json
      $entry = json_encode($entry, JSON_PRETTY_PRINT);

      echo("$id\n");
      // write the entry with its id
      fwrite($handle, "\"$id\": $entry");

      // ensure that the last entry does not have a comma
      $rows_passed++;
      if($f_result->num_rows > $rows_passed){
        fwrite($handle, ",\n");
      }else{
        fwrite($handle, "\n");
      }
    }

    // end the file with a }
    fwrite($handle, '}');

    // close file
    fclose($handle);
  }
