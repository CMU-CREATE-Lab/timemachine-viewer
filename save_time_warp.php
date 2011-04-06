<?php
header("Cache-Control: no-cache, must-revalidate");
header("Expires: Sat, 1 Jan 2011 00:00:01 GMT");
header('Content-type: application/x-warp');
header('Content-Disposition: attachment; filename="'.$_POST["filename"].'"');
?>
<?php echo $_POST["json"]; ?>